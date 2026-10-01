# MVP-58 IMPLEMENTATION PLAN — ADMIN + OBSERVABILITY CENTER

## 1. Architectural Objective
Create a secure, centralized administrative and observability telemetry system for TradeFlow that monitors platform health, system events, provider metrics, usage aggregates, and error rates while strictly restricting access to authenticated users with the `ADMIN` role.

## 2. Components
1. **Model**: `backend/models/SystemEventModel.js`:
   - `type`: Enum `['AUTH_FAILURE', 'RATE_LIMIT_VIOLATION', 'PROVIDER_FAILURE', 'WORKFLOW_FAILURE', 'AI_FAILURE', 'DATABASE_ERROR', 'SECURITY_ALERT']`
   - `severity`: Enum `['INFO', 'WARNING', 'ERROR', 'CRITICAL']`
   - `message`: String
   - `details`: Mixed (sanitized, zero secrets/passwords/JWTs/API keys)
   - `userId`: ObjectId, ref 'User', default null
   - `ip`: String
   - `timestamp`: Date, default Date.now, indexed
2. **Service**: `backend/services/adminService.js`:
   - `logSystemEvent(type, severity, message, details, userId, ip)`: Sanitizes secrets before storing.
   - `getOverview()`: Aggregates total users, total organizations, monthly active users, total API/AI/Backtest/Workflow events, provider errors, and system event counts.
   - `getUsersList(page, limit)`: Paginated user roster with account status and roles (zero password hashes).
   - `getOrganizationsList(page, limit)`: Paginated organization roster with member counts.
   - `getProviderHealth()`: Real-time health, latency, last success timestamp, error count for `TWELVE_DATA`, `ALPHA_VANTAGE`, `MOCK`.
   - `getSystemEvents(filter, page, limit)`: Paginated security and operational audit event stream.
3. **Middleware**: `backend/middleware/adminMiddleware.js`:
   - Checks `req.user.role === 'ADMIN'`. If not, returns 403 Forbidden.
4. **Controller & Routes**:
   - `backend/controllers/adminController.js`
   - `backend/routes/adminRoutes.js`:
     - `GET /api/v1/admin/overview`
     - `GET /api/v1/admin/users`
     - `GET /api/v1/admin/organizations`
     - `GET /api/v1/admin/providers`
     - `GET /api/v1/admin/system-events`
5. **Test Suite**:
   - `backend/test_mvp58.js`:
     - Admin authorization success
     - Non-admin 403 rejection
     - Overview metrics calculation
     - Provider health tracking
     - System events logging & PII/secret scrubbing
     - Zero financial mutations

## 3. Documentation
- `docs/MVP58_IMPLEMENTATION_PLAN.md`
- `docs/MVP58_WALKTHROUGH.md`
- `docs/MVP58_FINAL_AUDIT.md`
