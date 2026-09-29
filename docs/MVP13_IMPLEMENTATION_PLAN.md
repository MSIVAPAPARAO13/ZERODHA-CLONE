# MVP-13 Implementation Plan: Adaptive Decision Loop

## 1. Goal
Connect Behavioral Edge facts to future execution via Playbooks. A "Playbook" is a user-defined set of rules (Checklist). When a behavioral pattern is detected, the user can create a Rule to add to a Playbook. Future trades optionally use a Playbook. `TradeJournal` records which Playbook was used and which rules were checked. `TradeReplay` evaluates compliance.

## 2. Models
Create `backend/models/PlaybookModel.js`:
- `user`: ObjectId, ref 'User'
- `name`: String, required
- `description`: String
- `isActive`: Boolean, default true
- `rules`: Array of subdocuments:
  - `text`: String
  - `category`: String (PLANNING, RISK, ENTRY, EXIT, JOURNAL)
  - `required`: Boolean

Update `backend/models/TradeJournalModel.js`:
- `playbook`: ObjectId, ref 'Playbook' (optional)
- `checklist`: Map or Array marking which rules were followed. (e.g. `[{ ruleText: String, followed: Boolean }]`)

## 3. Services & Controllers
Create `backend/services/playbookService.js` and `backend/controllers/playbookController.js`:
- CRUD operations for Playbooks.
- Limit: 10 playbooks, 20 rules per playbook.
- Check duplicate rules by trimming/lowercase.

Update `aiAnalystService.js` and `aiContextService.js`:
- Context builder `getPlaybookSuggestionContext(pattern)`
- Prompt builder for playbook suggestions.
- Context builder `getPlaybookReviewContext()`
- Prompt builder for playbook AI review.

## 4. API Endpoints
Create `backend/routes/playbookRoutes.js`:
- GET, POST, PATCH, DELETE `/api/v1/playbooks`
Add AI endpoints to `aiRoutes.js`:
- POST `/api/v1/ai/playbook-suggestions`
- GET `/api/v1/ai/playbook-review`

## 5. Frontend Integration
Create `Playbooks.js` in `dashboard/src/components`:
- List playbooks, edit rules, delete playbooks.

Update `BuyActionWindow.js`:
- Fetch user playbooks.
- Show an optional dropdown: "Select Playbook".
- If selected, render checklist.
- Prevent submission if a `required` rule is unchecked (unless user skips?). Actually, we will just pass the completed state to the backend when placing the order.

Update `BehaviorInsights.js`:
- On `TARGET_WITHOUT_RISK` pattern, add "Create Process Rule" button that calls AI suggestion, then prompts to save to a playbook.

Update `TradeReplay.js`:
- Show playbook compliance (which rules were followed).

## 6. Execution Flow (Adaptive Loop)
1. AI/Analytics flag pattern -> 2. AI suggests rule -> 3. User saves rule to Playbook -> 4. User trades using Playbook checklist -> 5. Journal saves checklist state -> 6. Replay displays compliance -> 7. Analytics evaluates compliance % over time.

## 7. Limitations & Rules
- Backend never creates rules automatically.
- No new external API needed.
- `Quick Trade` works perfectly without selecting a Playbook.
