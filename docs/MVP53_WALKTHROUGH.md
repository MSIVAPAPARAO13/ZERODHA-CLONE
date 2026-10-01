# MVP-53 WALKTHROUGH — RESEARCH WORKFLOW BUILDER

## Overview
MVP-53 introduces the **Research Workflow Builder**, enabling traders and researchers to assemble, save, version, duplicate, and execute repeatable multi-step research pipelines without writing code or executing unverified scripts.

## Core Capabilities Implemented

### 1. Workflow Data Model (`ResearchWorkflowModel`)
- Schema persists workflow `name`, `description`, `version`, `enabled`, and ordered `steps`.
- Each step defines: `stepId`, `toolName`, `params`, `order`, `enabled`.
- Indexed on `{ user: 1, name: 1 }` for high performance user-scoped access.

### 2. Controlled Allowlisted Execution
- Every step is strictly validated against `ALLOWED_TOOLS` (from `researchAgentService`).
- Unauthorized tools (e.g. bash scripts, raw SQL, direct DB operations) are rejected at validation time with `INVALID_STEP_TOOL`.
- Arbitrary code execution is impossible by design.

### 3. Workflow Management
- **Add / Remove / Reorder Steps**: Reordering updates step indices and automatically increments workflow `version`.
- **Duplicate Workflow**: Clones an existing workflow into a new record with `(Copy)` suffix and version reset to 1.
- **Toggle Steps**: Disabled steps are safely skipped during pipeline execution.
- **Step-level Audit**: Each step run logs start time, duration in ms, success flag, output data, and error messages.

### 4. Zero Financial Ledger Mutation & User Isolation
- Workflow execution interacts strictly with read-only market data, scanner, scenarios, and backtests.
- Financial ledgers (`virtualBalance`, `HoldingsModel`, `OrdersModel`, `PositionsModel`) are strictly untouched.
- All CRUD and execution endpoints enforce `req.user.userId`.

## API Endpoints
- `POST /api/v1/research/workflows`: Create workflow
- `GET /api/v1/research/workflows`: List user's workflows
- `GET /api/v1/research/workflows/:id`: Get workflow by ID
- `PATCH /api/v1/research/workflows/:id`: Update workflow details / steps
- `DELETE /api/v1/research/workflows/:id`: Delete workflow
- `POST /api/v1/research/workflows/:id/duplicate`: Duplicate workflow
- `POST /api/v1/research/workflows/:id/run`: Run workflow sequentially

## Test Results
10/10 automated tests passed in `backend/test_mvp53.js`:
- Test 1: Creation with allowlisted tools — PASS
- Test 2: Rejection of unauthorized steps — PASS
- Test 3: Step reordering & version increment — PASS
- Test 4: Workflow duplication — PASS
- Test 5: User isolation on read & execution — PASS
- Test 6: Sequential pipeline execution — PASS
- Test 7: Step failure handling & status reporting — PASS
- Test 8: Step enable/disable toggling — PASS
- Test 9: Workflow deletion — PASS
- Test 10: Zero financial ledger mutation — PASS
