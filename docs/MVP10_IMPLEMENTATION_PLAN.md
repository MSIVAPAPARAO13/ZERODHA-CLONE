# MVP-10 Implementation Plan: Trade Replay & Outcome Intelligence

## 1. Current Architecture
- `TradeJournalModel` holds user decisions, linked 1:1 with an `Order`.
- Financial transactions and orders are authoritative. 
- Real market data is accessed via `marketDataService.getHistoricalData`.

## 2. Defining a "Trade" for Replay
To determine if a trade is OPEN or CLOSED, we will use a simple FIFO pairing approach per symbol for the user based on `TransactionModel`.
- The Journal's entry `orderId` gives the entry `createdAt` and `quantity`.
- We query subsequent SELL transactions for the same symbol. We sum up their quantities to see if the entry quantity has been fully or partially exited.
- If total sold qty >= entry qty, the trade is `CLOSED`. Otherwise, it is `OPEN`.
- The exit price will be the volume-weighted average price of the matching SELL transactions.
- *Note:* We will use this simplified FIFO matching because building a full tax-lot accounting system is out of scope.

## 3. Replay Service (`tradeReplayService.js`)
We will create `tradeReplayService.getReplay(journalId, userId)`:
1. Fetch `journal = TradeJournalModel.findOne({ _id: journalId, user: userId })`
2. Fetch entry `Transaction` corresponding to the journal's order.
3. Fetch all `SELL` transactions for the symbol after the entry transaction's date. Compute matched exit quantity and volume-weighted exit price.
4. Calculate status: `OPEN` if matched exit qty < entry qty.
5. Determine `holdingDuration`: (exitTime or currentTime) - entryTime.
6. Fetch `historicalData` from `marketDataService.getHistoricalData(symbol, { interval: '1day' })`.
7. **Evaluate Target/Risk**:
   - Iterate over historical data points after the entry date.
   - Check if `high >= targetPrice` -> `targetReached = true` and record the date.
   - Check if `low <= riskPrice` -> `riskCrossed = true` and record the date.
8. Construct Replay Payload:
   ```json
   {
     "journal": { ... },
     "outcome": {
        "status": "OPEN|CLOSED",
        "entryTime": "...",
        "exitTime": "...",
        "exitPrice": 3650,
        "realizedPnl": 2300,
        "unrealizedPnl": 0,
        "holdingDurationDays": 10,
        "targetReached": true,
        "targetReachedDate": "...",
        "riskCrossed": false,
        "riskCrossedDate": null
     },
     "marketData": { "history": [...] }
   }
   ```

## 4. API Endpoint
Create `GET /api/v1/replay/:journalId`:
- Protected by `authMiddleware`.
- Calls `tradeReplayService.getReplay`.
- (Will add this to `journalRoutes.js` or `replayRoutes.js`).

## 5. Frontend UI
- Add `tradeReplayService` to `api.js`.
- Add a "View Replay" button in `TradeJournal.js` next to each entry.
- Create `TradeReplay.js` page showing:
  - **Your Decision**: Strategy, Confidence, Entry, Target, Risk, Thesis.
  - **What Happened**: A visual timeline using text/divs (no complex chart libraries). Showing Entry -> Target Crossed -> Actual Exit.
  - **Actual Outcome**: Exit, P&L, Holding Period.

## 6. Edge Cases & Resilience
- **Historical Data Unavailable**: The service will gracefully handle null returns from `getHistoricalData` and just say "Historical timeline unavailable" without crashing the replay.
- **Rate Limiting**: Same as above, degraded gracefully.
- **Partial Exits**: The FIFO matching will aggregate multiple sells up to the entry quantity.

## 7. Testing
- Create `test_mvp10.js` to create a journal, simulate some historical data, and assert the replay outcome (Open vs Closed, Target Detection).
- Regression test MVP-1 to MVP-9.
