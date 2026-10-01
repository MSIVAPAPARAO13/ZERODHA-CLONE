# MVP-56 IMPLEMENTATION PLAN — SHARED RESEARCH & COLLABORATION

## 1. Architectural Objective
Enable team members within an organization to collaborate on research sessions without leaking any private financial information (portfolios, virtual balances, private trades). Features include:
- Sharing research sessions with an organization
- First-class counter-evidence classification: `SUPPORTS_THESIS`, `CONTRADICTS_THESIS`, `NEUTRAL`
- Threaded comments, mentions, and resolution
- Research versioning (diff tracking: who changed it, what changed, and when)

## 2. Models
1. `ResearchCommentModel.js`:
   - `researchSession`: ObjectId, ref 'ResearchSession', required
   - `organization`: ObjectId, ref 'Organization', required
   - `author`: ObjectId, ref 'User', required
   - `body`: String, required
   - `evidenceType`: Enum `['SUPPORTS_THESIS', 'CONTRADICTS_THESIS', 'NEUTRAL']`, default `'NEUTRAL'`
   - `evidenceDetails`: Mixed, default `{}`
   - `mentions`: [ObjectId, ref 'User']
   - `parentComment`: ObjectId, ref 'ResearchComment', default null
   - `resolved`: Boolean, default false
   - timestamps
2. `ResearchVersionModel.js` (or embedded in `ResearchSessionModel`):
   - Track session revisions: version number, changedBy, snapshot, summary of changes, timestamp.

## 3. Services & Controllers
- `collaborationService.js`:
  - `shareSession(userId, sessionId, organizationId)`
  - `addComment(userId, sessionId, commentData)` (supports counter-evidence tags and mentions)
  - `resolveComment(userId, commentId)`
  - `getComments(userId, sessionId)`
  - `createSessionVersion(userId, sessionId, updateData, changeSummary)`
  - `getSessionHistory(userId, sessionId)`
- `collaborationController.js`:
  - Handlers for comments, sharing, and versioning.
- Mount routes under `/api/v1/collaboration` or `/api/v1/research`.

## 4. Test Suite
- `backend/test_mvp56.js`:
  - Session sharing to organization
  - Comment creation with threaded replies and mentions
  - Counter-evidence tagging (`CONTRADICTS_THESIS`, `SUPPORTS_THESIS`)
  - Comment resolution workflow
  - Version creation, history lookup, and diff provenance
  - Organization isolation (users outside org cannot view/comment)
  - Private data protection (zero portfolio exposure)
  - Zero financial ledger mutations

## 5. Documentation
- `docs/MVP56_IMPLEMENTATION_PLAN.md`
- `docs/MVP56_WALKTHROUGH.md`
- `docs/MVP56_FINAL_AUDIT.md`
