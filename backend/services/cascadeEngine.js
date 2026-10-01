const crypto = require('crypto');
const { HoldingsModel } = require('../models/HoldingsModel');
const { PositionsModel } = require('../models/PositionsModel');
const { PlaybookModel } = require('../models/PlaybookModel');
const { TradeJournalModel } = require('../models/TradeJournalModel');
const { WatchlistModel } = require('../models/WatchlistModel');
const { AlertModel } = require('../models/AlertModel');
const { ThesisReviewModel } = require('../models/ThesisReviewModel');
const marketDataService = require('./marketDataService');
const { getVerifiedMetadata } = require('../config/marketMetadata');

// In-memory cache for public and user cascades
const publicCache = new Map();
const userCache = new Map();
const PUBLIC_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const USER_CACHE_TTL_MS = 5 * 60 * 1000;    // 5 minutes

// Default curated market events for deterministic testing and live feed
const DEFAULT_MARKET_EVENTS = [
  {
    id: 'evt-tcs-earnings-2026',
    symbol: 'TCS',
    title: 'TCS Announces Q3 Financial Results with Modest Operating Margin Contraction',
    summary: 'Tata Consultancy Services reported Q3 revenue growth of 2.1% YoY with operating margins contracting by 45 basis points due to seasonal furloughs and higher delivery costs.',
    category: 'EARNINGS',
    publishedAt: '2026-09-15T09:15:00.000Z',
    effectiveAt: '2026-09-15T09:15:00.000Z',
    provider: 'AlphaVantage',
    sourceType: 'MARKET_DATA_PROVIDER'
  },
  {
    id: 'evt-it-semiconductor-reg-2026',
    symbol: 'TCS',
    title: 'US Imposes New Cross-Border Semiconductor and Tech Export Restrictions',
    summary: 'The US Department of Commerce announced tightened export guidelines for high-performance computing hardware and enterprise software implementations affecting global tech service providers.',
    category: 'REGULATION',
    publishedAt: '2026-09-20T14:30:00.000Z',
    effectiveAt: '2026-09-20T14:30:00.000Z',
    provider: 'TwelveData',
    sourceType: 'MARKET_DATA_PROVIDER'
  },
  {
    id: 'evt-reliance-green-energy-2026',
    symbol: 'RELIANCE',
    title: 'Reliance Industries Commissions Major Phase of Giga-Scale Clean Energy Complex',
    summary: 'Reliance Industries announced operational readiness of its solar module gigafactory at Jamnagar, accelerating capex deployment in sustainable power infrastructure.',
    category: 'CORPORATE_ACTION',
    publishedAt: '2026-09-25T11:00:00.000Z',
    effectiveAt: '2026-09-25T11:00:00.000Z',
    provider: 'TwelveData',
    sourceType: 'MARKET_DATA_PROVIDER'
  },
  {
    id: 'evt-infy-large-deal-2026',
    symbol: 'INFY',
    title: 'Infosys Signs $1.5B Multi-Year Cloud Transformation Deal with European Financial Group',
    summary: 'Infosys secured a 5-year digital transformation mandate to modernize core banking workloads onto hybrid cloud infrastructure.',
    category: 'CORPORATE_ACTION',
    publishedAt: '2026-09-28T08:45:00.000Z',
    effectiveAt: '2026-09-28T08:45:00.000Z',
    provider: 'AlphaVantage',
    sourceType: 'MARKET_DATA_PROVIDER'
  }
];

class CascadeEngine {
  /**
   * Retrieve all normalized market events
   */
  async getMarketEvents(query = {}) {
    const { symbol, limit = 20 } = query;
    let events = [...DEFAULT_MARKET_EVENTS];

    if (symbol) {
      const upper = symbol.toUpperCase().trim();
      events = events.filter(e => e.symbol === upper);
      
      // Attempt live news fetch from marketDataService if available
      try {
        const liveNews = await marketDataService.getNewsSentiment(upper, {}).catch(() => null);
        if (liveNews && liveNews.articles && liveNews.articles.length > 0) {
          liveNews.articles.slice(0, 5).forEach((article, idx) => {
            const hashId = 'evt-live-' + crypto.createHash('sha256').update(article.url || article.title).digest('hex').substring(0, 12);
            if (!events.some(e => e.id === hashId)) {
              events.push({
                id: hashId,
                symbol: upper,
                title: article.title,
                summary: article.summary || article.title,
                category: 'NEWS',
                publishedAt: article.publishedAt || new Date().toISOString(),
                effectiveAt: article.publishedAt || new Date().toISOString(),
                provider: liveNews.source || 'AlphaVantage',
                sourceType: 'MARKET_DATA_PROVIDER'
              });
            }
          });
        }
      } catch (err) {
        // Fallback silently to existing events on provider rate limit
      }
    }

    return events.slice(0, parseInt(limit, 10));
  }

  /**
   * Find an event by ID
   */
  async getEventById(eventId) {
    const events = await this.getMarketEvents();
    return events.find(e => e.id === eventId) || null;
  }

  /**
   * Generate Market Event Cascade Graph
   * @param {string} eventId 
   * @param {string} userId 
   * @param {object} options { depth, relationshipTypes, asOf }
   */
  async generateCascade(eventId, userId, options = {}) {
    const depth = Math.min(Math.max(parseInt(options.depth || 3, 10), 1), 3);
    const relationshipTypesFilter = options.relationshipTypes 
      ? options.relationshipTypes.split(',').map(s => s.trim().toUpperCase()) 
      : null;
    const asOf = options.asOf ? new Date(options.asOf) : null;

    // Check private cache
    const cacheKey = `${userId}:${eventId}:${depth}:${options.relationshipTypes || 'all'}:${asOf ? asOf.toISOString() : 'now'}`;
    const cached = userCache.get(cacheKey);
    if (cached && (Date.now() - cached.cachedAt < USER_CACHE_TTL_MS)) {
      return cached.data;
    }

    // 1. Fetch Event
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    const eventDate = new Date(event.publishedAt || event.effectiveAt);
    // Strict temporal boundary: If asOf is provided, evaluate as of asOf; otherwise as of current
    const temporalThreshold = asOf || new Date();

    // 2. Initialize Graph
    const nodes = [];
    const edges = [];
    const visitedNodes = new Set();
    const edgeSet = new Set();

    const addNode = (node) => {
      if (!visitedNodes.has(node.id)) {
        visitedNodes.add(node.id);
        nodes.push(node);
      }
    };

    const addEdge = (edge) => {
      // Filter by relationship type if requested
      if (relationshipTypesFilter && !relationshipTypesFilter.includes(edge.relationshipType)) {
        return;
      }
      const edgeKey = `${edge.source}->${edge.target}:${edge.relationshipType}:${edge.effectiveAt}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push(edge);
      }
    };

    // Root Node (Depth 0): The Event
    const eventNodeId = `event:${event.id}`;
    addNode({
      id: eventNodeId,
      type: 'EVENT',
      name: event.title,
      symbol: event.symbol,
      metadata: {
        category: event.category,
        publishedAt: event.publishedAt,
        provider: event.provider,
        summary: event.summary
      },
      source: event.provider || 'MARKET_DATA_PROVIDER'
    });

    // Depth 1: Direct Entity (Security)
    const directSymbol = event.symbol.toUpperCase();
    const symbolNodeId = `symbol:${directSymbol}`;
    
    addNode({
      id: symbolNodeId,
      type: 'DIRECT_SECURITY',
      name: directSymbol,
      symbol: directSymbol,
      metadata: {
        symbol: directSymbol
      },
      source: 'EXCHANGE_IDENTIFIER'
    });

    addEdge({
      source: eventNodeId,
      target: symbolNodeId,
      relationshipType: 'DIRECT_SECURITY',
      sourceType: 'MARKET_DATA_PROVIDER',
      provider: event.provider || 'AlphaVantage',
      effectiveAt: event.effectiveAt,
      retrievedAt: new Date().toISOString(),
      confidence: 'PROVIDER_SUPPLIED',
      evidence: `Event explicitly specifies ticker symbol ${directSymbol}`
    });

    // Lookup verified taxonomy
    const taxonomy = getVerifiedMetadata(directSymbol);

    // Depth 2: Sector & Verified Related Entities
    if (depth >= 2) {
      if (taxonomy && taxonomy.sector) {
        const sectorNodeId = `sector:${taxonomy.sector.replace(/\s+/g, '_')}`;
        addNode({
          id: sectorNodeId,
          type: 'SECTOR',
          name: taxonomy.sector,
          symbol: directSymbol,
          metadata: {
            industry: taxonomy.industry
          },
          source: taxonomy.provider
        });

        addEdge({
          source: symbolNodeId,
          target: sectorNodeId,
          relationshipType: 'SECTOR',
          sourceType: 'VERIFIED_REGISTRY',
          provider: taxonomy.provider,
          effectiveAt: event.effectiveAt,
          retrievedAt: new Date().toISOString(),
          confidence: 'VERIFIED',
          evidence: `${directSymbol} officially operates within the ${taxonomy.sector} sector (${taxonomy.industry})`
        });
      } else {
        // No fabricated sector
        // RELATIONSHIP UNAVAILABLE
      }

      // Related entities (Peers) strictly from verified taxonomy
      if (taxonomy && taxonomy.relatedEntities && taxonomy.relatedEntities.length > 0) {
        taxonomy.relatedEntities.forEach(peerSymbol => {
          const peerNodeId = `symbol:${peerSymbol}`;
          addNode({
            id: peerNodeId,
            type: 'RELATED_ENTITY',
            name: peerSymbol,
            symbol: peerSymbol,
            metadata: {
              peerOf: directSymbol
            },
            source: taxonomy.provider
          });

          addEdge({
            source: symbolNodeId,
            target: peerNodeId,
            relationshipType: 'RELATED_ENTITY',
            sourceType: 'VERIFIED_REGISTRY',
            provider: taxonomy.provider,
            effectiveAt: event.effectiveAt,
            retrievedAt: new Date().toISOString(),
            confidence: 'VERIFIED',
            evidence: `${peerSymbol} is a verified peer in ${taxonomy.industry}`
          });
        });
      }
    }

    // Depth 3: User Portfolio Exposure, Strategies, Playbooks, Alerts, Theses
    let portfolioImpact = {
      symbol: directSymbol,
      isHeld: false,
      shares: 0,
      exposurePercent: 0,
      currentValue: 0
    };
    const matchedStrategies = [];
    const matchedTheses = [];
    const researchQuestions = [];

    if (depth >= 3) {
      // 1. Portfolio Intersection with Temporal Correctness
      // Query Holdings and Positions for the user
      const holdingsQuery = { user: userId };
      const positionsQuery = { user: userId };
      
      // If evaluating historical state (e.g. historical cascade), filter out records created after the event
      if (asOf || (eventDate < new Date())) {
        holdingsQuery.createdAt = { $lte: temporalThreshold };
        positionsQuery.createdAt = { $lte: temporalThreshold };
      }

      const [holdings, positions] = await Promise.all([
        HoldingsModel.find(holdingsQuery).lean(),
        PositionsModel.find(positionsQuery).lean()
      ]);

      let totalPortfolioValue = 0;
      let symbolHoldingValue = 0;
      let symbolShares = 0;

      // Calculate total portfolio value and target symbol value
      const allAssets = [...holdings, ...positions];
      allAssets.forEach(asset => {
        const val = (asset.qty || 0) * (asset.price || asset.avg || 0);
        totalPortfolioValue += val;
        if (asset.name && asset.name.toUpperCase() === directSymbol) {
          symbolHoldingValue += val;
          symbolShares += (asset.qty || 0);
        }
      });

      if (symbolShares > 0 && totalPortfolioValue > 0) {
        const exposurePercent = parseFloat(((symbolHoldingValue / totalPortfolioValue) * 100).toFixed(2));
        portfolioImpact = {
          symbol: directSymbol,
          isHeld: true,
          shares: symbolShares,
          currentValue: symbolHoldingValue,
          exposurePercent
        };

        const portfolioNodeId = `portfolio:${directSymbol}`;
        addNode({
          id: portfolioNodeId,
          type: 'PORTFOLIO',
          name: `Portfolio (${exposurePercent}%)`,
          symbol: directSymbol,
          metadata: {
            exposurePercent,
            shares: symbolShares,
            totalValue: symbolHoldingValue
          },
          source: 'INTERNAL_LEDGER'
        });

        addEdge({
          source: symbolNodeId,
          target: portfolioNodeId,
          relationshipType: 'PORTFOLIO',
          sourceType: 'DERIVED_CALCULATION',
          provider: 'TradeFlowPortfolioEngine',
          effectiveAt: asOf ? asOf.toISOString() : event.effectiveAt,
          retrievedAt: new Date().toISOString(),
          confidence: 'DERIVED',
          evidence: `Account holds ${symbolShares} shares of ${directSymbol}, representing ${exposurePercent}% total portfolio exposure`
        });
      }

      // Check Watchlist
      const watchlistQuery = { user: userId, symbol: directSymbol };
      if (asOf) watchlistQuery.createdAt = { $lte: temporalThreshold };
      const onWatchlist = await WatchlistModel.findOne(watchlistQuery).lean();
      if (onWatchlist) {
        const watchlistNodeId = `watchlist:${directSymbol}`;
        addNode({
          id: watchlistNodeId,
          type: 'WATCHLIST',
          name: `Watchlist: ${directSymbol}`,
          symbol: directSymbol,
          metadata: { trackedSince: onWatchlist.createdAt },
          source: 'USER_WATCHLIST'
        });

        addEdge({
          source: symbolNodeId,
          target: watchlistNodeId,
          relationshipType: 'WATCHLIST',
          sourceType: 'USER_DATABASE',
          provider: 'TradeFlow',
          effectiveAt: onWatchlist.createdAt ? onWatchlist.createdAt.toISOString() : event.effectiveAt,
          retrievedAt: new Date().toISOString(),
          confidence: 'USER_DEFINED',
          evidence: `${directSymbol} is explicitly monitored in active watchlist`
        });
      }

      // Check Alerts
      const alertQuery = { user: userId, symbol: directSymbol, isActive: true };
      if (asOf) alertQuery.createdAt = { $lte: temporalThreshold };
      const activeAlerts = await AlertModel.find(alertQuery).lean();
      activeAlerts.forEach(alert => {
        const alertNodeId = `alert:${alert._id}`;
        addNode({
          id: alertNodeId,
          type: 'ALERT',
          name: `Alert: ${alert.condition} ${alert.targetPrice}`,
          symbol: directSymbol,
          metadata: { targetPrice: alert.targetPrice, condition: alert.condition },
          source: 'USER_ALERT'
        });

        addEdge({
          source: symbolNodeId,
          target: alertNodeId,
          relationshipType: 'ALERT',
          sourceType: 'USER_DATABASE',
          provider: 'TradeFlow',
          effectiveAt: alert.createdAt ? alert.createdAt.toISOString() : event.effectiveAt,
          retrievedAt: new Date().toISOString(),
          confidence: 'USER_DEFINED',
          evidence: `Active price trigger configured at ${alert.targetPrice}`
        });
      });

      // 2. Strategy & Playbook Intersections
      const playbookQuery = { user: userId, isActive: true };
      if (asOf) playbookQuery.createdAt = { $lte: temporalThreshold };
      const playbooks = await PlaybookModel.find(playbookQuery).lean();

      playbooks.forEach(pb => {
        // Match if playbook mentions symbol, sector or common strategy keywords
        const pbText = `${pb.name} ${pb.description || ''} ${pb.strategy || ''}`.toUpperCase();
        const matchesSymbol = pbText.includes(directSymbol);
        const matchesSector = taxonomy && taxonomy.sector && pbText.includes(taxonomy.sector.toUpperCase());
        const isGeneralStrategy = pb.strategy && ['MOMENTUM', 'BREAKOUT', 'TREND', 'EARNINGS'].includes(pb.strategy.toUpperCase());

        if (matchesSymbol || matchesSector || isGeneralStrategy) {
          const pbNodeId = `playbook:${pb._id}`;
          addNode({
            id: pbNodeId,
            type: 'PLAYBOOK',
            name: pb.name,
            symbol: directSymbol,
            metadata: {
              strategy: pb.strategy,
              rulesCount: pb.rules ? pb.rules.length : 0
            },
            source: 'USER_PLAYBOOK'
          });

          addEdge({
            source: symbolNodeId,
            target: pbNodeId,
            relationshipType: 'PLAYBOOK',
            sourceType: 'USER_DATABASE',
            provider: 'TradeFlow',
            effectiveAt: pb.createdAt ? pb.createdAt.toISOString() : event.effectiveAt,
            retrievedAt: new Date().toISOString(),
            confidence: 'USER_DEFINED',
            evidence: `Playbook "${pb.name}" utilizes strategy ${pb.strategy || 'EXECUTION'} relevant to ${directSymbol}`
          });

          matchedStrategies.push({
            id: pb._id,
            name: pb.name,
            strategy: pb.strategy,
            rulesCount: pb.rules ? pb.rules.length : 0
          });
        }
      });

      // 3. Thesis Intersections, Thesis Drift Detection, and Versioning
      const journalQuery = { user: userId, symbol: directSymbol };
      if (asOf) journalQuery.createdAt = { $lte: temporalThreshold };
      const journals = await TradeJournalModel.find(journalQuery).sort({ createdAt: -1 }).lean();

      for (const journal of journals) {
        if (!journal.thesis && !journal.reason) continue;

        // Check if there is an existing user-confirmed review for this thesis & event
        const existingReview = await ThesisReviewModel.findOne({
          user: userId,
          eventId: event.id,
          thesisId: journal._id
        }).sort({ reviewedAt: -1 }).lean();

        // Compute Thesis Diff
        const expectedAssumption = journal.thesis || `Strategy: ${journal.strategy}, Expected holding: ${journal.expectedHoldingPeriod || 'UNSPECIFIED'}`;
        const observedEvidence = `${event.title} - ${event.summary}`;
        const diffStatement = `Observed evidence from ${event.provider || 'market provider'} indicates new material catalyst (${event.category}), requiring verification against stored assumption: "${expectedAssumption}".`;

        // Deterministic status: Never declare CONTRADICTED automatically without explicit falsification rule
        let thesisStatus = 'REQUIRES_REVIEW';
        let thesisVersion = 1;
        let reviewHistory = [];

        if (existingReview) {
          thesisStatus = existingReview.newStatus;
          thesisVersion = existingReview.thesisVersion;
          reviewHistory = existingReview.auditTrail || [];
        }

        const thesisNodeId = `thesis:${journal._id}`;
        addNode({
          id: thesisNodeId,
          type: 'THESIS',
          name: `Thesis: ${journal.strategy || 'Position'}`,
          symbol: directSymbol,
          metadata: {
            journalId: journal._id,
            thesis: expectedAssumption,
            status: thesisStatus,
            version: thesisVersion,
            targetPrice: journal.targetPrice,
            riskPrice: journal.riskPrice
          },
          source: 'USER_JOURNAL'
        });

        addEdge({
          source: symbolNodeId,
          target: thesisNodeId,
          relationshipType: 'THESIS',
          sourceType: 'USER_DATABASE',
          provider: 'TradeFlow',
          effectiveAt: journal.createdAt ? journal.createdAt.toISOString() : event.effectiveAt,
          retrievedAt: new Date().toISOString(),
          confidence: 'USER_DEFINED',
          evidence: `User journal entry authored on ${journal.createdAt ? journal.createdAt.toISOString().split('T')[0] : 'record'} asserts thesis: "${expectedAssumption.substring(0, 80)}..."`
        });

        const thesisItem = {
          id: journal._id,
          journalId: journal._id,
          symbol: directSymbol,
          strategy: journal.strategy,
          storedAssumption: expectedAssumption,
          observedEvidence,
          diff: {
            expected: expectedAssumption,
            observed: observedEvidence,
            difference: diffStatement
          },
          status: thesisStatus,
          version: thesisVersion,
          reviewHistory,
          targetPrice: journal.targetPrice,
          riskPrice: journal.riskPrice,
          createdAt: journal.createdAt
        };
        matchedTheses.push(thesisItem);

        // 4. Synthesize Grounded Research Question (5 Mandatory Components: Event, Entity, Existing Thesis, Observed Evidence, Unknown)
        const primaryPlaybook = matchedStrategies[0] ? matchedStrategies[0].name : 'Active Strategy';
        const researchQuestion = {
          question: `How does the ${event.category.toLowerCase()} event ("${event.title}") affect the valuation and holding assumptions for ${directSymbol} documented in ${primaryPlaybook}, and does the observed evidence change the anticipated risk threshold?`,
          affectedEntity: directSymbol,
          eventTitle: event.title,
          existingThesis: expectedAssumption,
          observedEvidence,
          unknown: 'Whether upcoming quarterly operating metrics and price reaction sustain the original investment thesis.',
          thesisId: journal._id,
          generatedAt: new Date().toISOString()
        };
        researchQuestions.push(researchQuestion);
      }
    }

    // Fallback research question if no specific journal thesis exists
    if (researchQuestions.length === 0) {
      researchQuestions.push({
        question: `How does ${event.title} impact ${directSymbol} and its sector peers, and what empirical evidence is needed to establish a risk-managed position?`,
        affectedEntity: directSymbol,
        eventTitle: event.title,
        existingThesis: 'None documented',
        observedEvidence: event.summary,
        unknown: 'Whether this corporate event shifts market consensus on future sector growth.',
        generatedAt: new Date().toISOString()
      });
    }

    const cascadeData = {
      event,
      nodes,
      edges,
      portfolioImpact,
      strategies: matchedStrategies,
      theses: matchedTheses,
      researchQuestions,
      meta: {
        depth,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        generatedAt: new Date().toISOString(),
        calculationVersion: '1.0.0-MVP33'
      }
    };

    // Cache private user cascade
    userCache.set(cacheKey, {
      cachedAt: Date.now(),
      data: cascadeData
    });

    return cascadeData;
  }

  /**
   * Submit User-Confirmed Thesis Review
   */
  async submitThesisReview(userId, eventId, data) {
    const { thesisId, status, reason } = data;
    if (!['STILL_VALID', 'NEEDS_UPDATE', 'NO_LONGER_RELEVANT'].includes(status)) {
      throw new Error('INVALID_REVIEW_STATUS');
    }

    const journal = await TradeJournalModel.findOne({ _id: thesisId, user: userId });
    if (!journal) {
      throw new Error('THESIS_NOT_FOUND');
    }

    // Find previous review to increment version
    const previousReview = await ThesisReviewModel.findOne({
      user: userId,
      thesisId,
      eventId
    }).sort({ reviewedAt: -1 });

    const newVersion = previousReview ? (previousReview.thesisVersion + 1) : 1;
    const previousStatus = previousReview ? previousReview.newStatus : 'REQUIRES_REVIEW';

    const auditEntry = {
      action: 'USER_REVIEW',
      timestamp: new Date(),
      fromStatus: previousStatus,
      toStatus: status,
      note: reason || `User marked thesis as ${status}`
    };

    const reviewDoc = new ThesisReviewModel({
      user: userId,
      eventId,
      thesisId,
      playbookId: journal.playbook || null,
      symbol: journal.symbol,
      thesisVersion: newVersion,
      previousStatus,
      newStatus: status,
      reason: reason || '',
      reviewedAt: new Date(),
      reviewedBy: userId,
      thesisSnapshot: {
        thesisText: journal.thesis,
        strategy: journal.strategy,
        reason: journal.reason,
        targetPrice: journal.targetPrice,
        riskPrice: journal.riskPrice,
        expectedHoldingPeriod: journal.expectedHoldingPeriod
      },
      auditTrail: previousReview ? [...previousReview.auditTrail, auditEntry] : [auditEntry]
    });

    await reviewDoc.save();

    // Invalidate private cache for this user
    for (const key of userCache.keys()) {
      if (key.startsWith(`${userId}:${eventId}`)) {
        userCache.delete(key);
      }
    }

    return reviewDoc;
  }

  /**
   * Create and Save a Research Question
   */
  async saveResearchQuestion(userId, eventId, data) {
    const { question, context, thesisId } = data;
    if (!question) throw new Error('QUESTION_REQUIRED');

    // Update existing review or create lightweight record
    let reviewDoc = await ThesisReviewModel.findOne({ user: userId, eventId, thesisId });
    if (!reviewDoc) {
      reviewDoc = new ThesisReviewModel({
        user: userId,
        eventId,
        thesisId: thesisId || null,
        symbol: data.affectedSymbol || 'GENERAL',
        newStatus: 'REQUIRES_REVIEW',
        reviewedBy: userId,
        researchQuestions: []
      });
    }

    reviewDoc.researchQuestions.push({
      question,
      context: context || '',
      createdAt: new Date()
    });

    await reviewDoc.save();
    return reviewDoc;
  }
}

module.exports = new CascadeEngine();
