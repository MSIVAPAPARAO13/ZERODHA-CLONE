# MVP-27 Implementation Plan: Market Intelligence & Opportunity Discovery

## 1. Architecture
- **MarketRadarService**: Orchestrates scanning. Reads active Playbooks and user Watchlists.
- **ScannerService & ConditionEngine**: Evaluates logical criteria. Example: `{ operator: 'GT', field: 'volumeRatio', value: 1.5 }` mapped against `MarketDataService` outputs.
- **OpportunityService**: Takes matching results and persists them to the `ResearchWatchlist`.

## 2. Playbook Matching
The engine translates active Playbook rules into Condition Engine parameters. If a symbol in the user's Watchlist meets >= 80% of the conditions, it generates a "PLAYBOOK MATCH" Research Opportunity.

## 3. AI NLP Scanner
An endpoint `/api/v1/scanner/nlp` will accept a string like "high volume and price change > 3%". The LLM will strictly output JSON mapping to the ConditionEngine. The backend fully validates this JSON schema before execution, ignoring any hallucinated fields.

## 4. API Throttling
Scans are limited to a subset (e.g., the User's Watchlist) to respect TwelveData/AlphaVantage API limits. Cache is strictly utilized across interval pull requests.
