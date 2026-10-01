const { TradeJournalModel } = require("../models/TradeJournalModel");

class JournalIntelligenceService {
  /**
   * Complete trade review recording
   */
  async recordTradeReview(userId, journalId, reviewData) {
    const journal = await TradeJournalModel.findOne({ _id: journalId, user: userId });
    if (!journal) {
      throw new Error("JOURNAL_ENTRY_NOT_FOUND");
    }

    const {
      setup,
      thesis,
      evidence = [],
      emotion = "NEUTRAL",
      mistake = "",
      executionNote = "",
      result = {},
      lesson = "",
      researchSessionId = null,
      reviewDate = null,
      isEarlyExit = false
    } = reviewData;

    if (setup !== undefined) journal.setup = setup;
    if (thesis !== undefined) journal.thesis = thesis;
    if (evidence && Array.isArray(evidence)) journal.evidence = evidence;
    if (emotion !== undefined) journal.emotion = emotion;
    if (mistake !== undefined) journal.mistake = mistake;
    if (executionNote !== undefined) journal.executionNote = executionNote;
    if (lesson !== undefined) journal.lesson = lesson;
    if (researchSessionId !== undefined) journal.researchSessionId = researchSessionId;
    if (reviewDate !== undefined) journal.reviewDate = reviewDate;
    if (isEarlyExit !== undefined) journal.isEarlyExit = isEarlyExit;

    if (result) {
      journal.result = {
        pnl: result.pnl !== undefined ? Number(result.pnl) : journal.result?.pnl || 0,
        pnlPercent: result.pnlPercent !== undefined ? Number(result.pnlPercent) : journal.result?.pnlPercent || 0,
        exitPrice: result.exitPrice !== undefined ? Number(result.exitPrice) : journal.result?.exitPrice || null,
        exitDate: result.exitDate ? new Date(result.exitDate) : journal.result?.exitDate || new Date(),
        status: result.status || "CLOSED"
      };
    }

    await journal.save();
    return journal;
  }

  /**
   * Deterministic, rule-based journal pattern detection
   * Strictly avoids psychological diagnoses
   */
  async detectJournalPatterns(userId) {
    const journals = await TradeJournalModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const totalTrades = journals.length;

    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        patterns: [],
        summary: "No journaled trades found. System requires trade records to detect patterns.",
        status: "DATA_LIMITED",
        disclaimer: "EMPIRICAL_JOURNAL_PATTERN — OBSERVED SYSTEM LOGS, NOT A PSYCHOLOGICAL OR FINANCIAL DIAGNOSIS"
      };
    }

    // 1. Trades without linked thesis
    const tradesWithoutThesis = journals.filter(j => !j.thesis || j.thesis.trim().length === 0);

    // 2. Trades without research session or verified evidence
    const tradesWithoutResearch = journals.filter(
      j => !j.researchSessionId && (!j.evidence || j.evidence.length === 0)
    );

    // 3. Early exits before target review date
    const earlyExits = journals.filter(j => {
      if (j.isEarlyExit) return true;
      if (j.reviewDate && j.result?.exitDate) {
        return new Date(j.result.exitDate) < new Date(j.reviewDate);
      }
      return false;
    });

    // 4. Frequent trading in identical symbol
    const symbolCounts = {};
    journals.forEach(j => {
      const sym = (j.symbol || "").toUpperCase();
      symbolCounts[sym] = (symbolCounts[sym] || 0) + 1;
    });
    const frequentSymbols = Object.keys(symbolCounts).filter(sym => symbolCounts[sym] >= 3);

    // 5. Setup performance breakdown
    const setupStats = {};
    journals.forEach(j => {
      const setup = j.setup || j.strategy || "UNSPECIFIED";
      if (!setupStats[setup]) setupStats[setup] = { total: 0, wins: 0, losses: 0 };
      setupStats[setup].total += 1;
      const pnl = j.result?.pnl || 0;
      if (pnl > 0) setupStats[setup].wins += 1;
      else if (pnl < 0) setupStats[setup].losses += 1;
    });

    const failedSetups = Object.keys(setupStats).filter(
      s => setupStats[s].total >= 3 && (setupStats[s].wins / setupStats[s].total) < 0.35
    );

    // Format transparent factual observations
    const patterns = [];

    if (tradesWithoutResearch.length > 0) {
      patterns.push({
        type: "UNLINKED_RESEARCH",
        count: tradesWithoutResearch.length,
        observation: `${tradesWithoutResearch.length} of ${totalTrades} trades have no linked research session or structured evidence.`
      });
    }

    if (earlyExits.length > 0) {
      patterns.push({
        type: "EARLY_EXIT",
        count: earlyExits.length,
        observation: `${earlyExits.length} of ${totalTrades} trades were exited before the planned review date.`
      });
    }

    if (tradesWithoutThesis.length > 0) {
      patterns.push({
        type: "MISSING_THESIS",
        count: tradesWithoutThesis.length,
        observation: `${tradesWithoutThesis.length} trades were executed without an explicit written thesis.`
      });
    }

    if (frequentSymbols.length > 0) {
      patterns.push({
        type: "FREQUENT_SYMBOL_CLUSTERING",
        symbols: frequentSymbols,
        observation: `Frequent trading concentrated in ${frequentSymbols.join(", ")} (>= 3 trades each).`
      });
    }

    if (failedSetups.length > 0) {
      patterns.push({
        type: "REPEATED_SETUP_FAILURE",
        setups: failedSetups,
        observation: `Setup '${failedSetups.join(", ")}' has an empirical win rate below 35% across ${setupStats[failedSetups[0]].total} trades.`
      });
    }

    const summaryText = `${totalTrades} recent paper trades analyzed.\n` +
      `${tradesWithoutResearch.length} had no linked research session.\n` +
      `${earlyExits.length} were exited before the original review date.\n\n` +
      `This is an observed journal pattern, not a diagnosis or recommendation.`;

    return {
      totalTrades,
      metrics: {
        unlinkedResearchCount: tradesWithoutResearch.length,
        earlyExitCount: earlyExits.length,
        missingThesisCount: tradesWithoutThesis.length,
        frequentSymbolsCount: frequentSymbols.length,
        failedSetupsCount: failedSetups.length
      },
      patterns,
      summary: summaryText,
      disclaimer: "EMPIRICAL_JOURNAL_PATTERN — OBSERVED SYSTEM LOGS, NOT A PSYCHOLOGICAL OR FINANCIAL DIAGNOSIS"
    };
  }
}

module.exports = new JournalIntelligenceService();
