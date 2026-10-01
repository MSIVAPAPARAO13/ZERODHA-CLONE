# MVP-53 IMPLEMENTATION PLAN — RESEARCH WORKFLOW BUILDER

## 1. Architectural Objective
Provide users with the ability to define, configure, persist, duplicate, and execute reusable research pipelines composed of allowlisted steps (e.g. `runScanner` -> `getQuote` -> `runBacktest` -> `runRobustness` -> `runScenario`). The system guarantees:
- Step allowlist enforcement (reuses `researchAgentService` tool registry)
- No arbitrary code execution or direct DB mutations
- Step validation & reordering
- Strict user isolation (`req.user.userId`)
- Step-by-step pipeline execution logging with timing, status, and aggregated evidence output
- Zero financial ledger mutations

## 2. Components
1. **Model**: `backend/models/ResearchWorkflowModel.js`
   - Fields: `user`, `name`, `description`, `steps` [{ stepId, toolName, params, order, enabled }], `version`, `enabled`, timestamps.
2. **Service**: `backend/services/researchWorkflowService.js`
   - Create, list, get, update, delete, duplicate workflows.
   - Validate step tool names against `ALLOWED_TOOLS`.
   - Pipeline runner: Executes steps in sequential order, collects evidence, logs step execution, returns comprehensive report.
3. **Controller & Routes**:
   - `backend/controllers/researchWorkflowController.js`
   - `backend/routes/researchWorkflowRoutes.js` (or integrated into `researchRoutes.js`)
   - Endpoints:
     - `POST /api/v1/research/workflows`
     - `GET /api/v1/research/workflows`
     - `GET /api/v1/research/workflows/:id`
     - `PATCH /api/v1/research/workflows/:id`
     - `DELETE /api/v1/research/workflows/:id`
     - `POST /api/v1/research/workflows/:id/duplicate`
     - `POST /api/v1/research/workflows/:id/run`
4. **Test Suite**:
   - `backend/test_mvp53.js`: Testing creation, step allowlist validation, reordering, duplicate, execution, failure resilience, user isolation, and zero financial mutations.
5. **Documentation**:
   - `docs/MVP53_IMPLEMENTATION_PLAN.md`
   - `docs/MVP53_WALKTHROUGH.md`
   - `docs/MVP53_FINAL_AUDIT.md`
