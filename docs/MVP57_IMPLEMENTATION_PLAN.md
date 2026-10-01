# MVP-57 IMPLEMENTATION PLAN — PRODUCT USAGE & SUBSCRIPTION FOUNDATION

## 1. Architectural Objective
Provide SaaS usage metering, tiered plan configuration (`FREE`, `PRO`, `TEAM`), and quota enforcement without hardcoding thresholds across controllers or introducing live payment gateways.

## 2. Components
1. **Config**: `backend/config/planConfig.js`
   - Defines tiered quotas for:
     - `aiRequests`: e.g. FREE 20/mo, PRO 500/mo, TEAM 5000/mo
     - `backtests`: e.g. FREE 10/mo, PRO 200/mo, TEAM 2000/mo
     - `scans`: e.g. FREE 30/mo, PRO 1000/mo, TEAM 10000/mo
     - `researchSessions`: e.g. FREE 5/mo, PRO 100/mo, TEAM 1000/mo
     - `automations`: e.g. FREE 2, PRO 25, TEAM 100
     - `workflowRuns`: e.g. FREE 10/mo, PRO 250/mo, TEAM 2500/mo
   - Features, descriptions, and pricing tiers metadata (without real credit card processing).
2. **Models**:
   - `UsageEventModel.js`: Audit log of discrete feature usage events `{ user, organization, feature, quantity, metadata, timestamp }`.
   - `UsageCounterModel.js`: Current billing cycle aggregates per user/org `{ user, organization, feature, count, period, updatedAt }`.
3. **Service**: `backend/services/usageService.js`:
   - `recordUsage(userId, feature, quantity, orgId)`
   - `getUsage(userId, orgId)`
   - `getLimits(userId, orgId)`
   - `checkQuota(userId, feature, requestedQuantity, orgId)`
   - `getPlan(userId)`
   - `resetUsage(userId, feature)`
4. **Controller & Routes**:
   - `backend/controllers/usageController.js`
   - `backend/routes/usageRoutes.js`
   - `backend/routes/billingRoutes.js`
   - Endpoints:
     - `GET /api/v1/usage`
     - `GET /api/v1/usage/limits`
     - `GET /api/v1/billing/plan`
5. **Test Suite**:
   - `backend/test_mvp57.js`:
     - Usage tracking & increment
     - Plan lookup from config
     - Limit calculation
     - Quota enforcement (pass vs limit reached)
     - Counter reset logic
     - Organization-level vs user-level metering
     - Zero financial ledger mutations

## 3. Documentation
- `docs/MVP57_IMPLEMENTATION_PLAN.md`
- `docs/MVP57_WALKTHROUGH.md`
- `docs/MVP57_FINAL_AUDIT.md`
