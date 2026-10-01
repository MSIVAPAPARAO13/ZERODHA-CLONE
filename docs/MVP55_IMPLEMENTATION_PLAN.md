# MVP-55 IMPLEMENTATION PLAN — TEAM / ORGANIZATION WORKSPACE

## 1. Architectural Objective
Transform TradeFlow into a multi-tenant, collaborative organization platform where teams can create organizations, manage role-based memberships (`OWNER`, `ADMIN`, `RESEARCHER`, `VIEWER`), and collaborate on research sessions, workflows, strategy experiments, and decisions.

Critical Safety Principle:
- **Private Data Isolation**: Private financial data (`virtualBalance`, holdings, orders, positions, and private trade journal entries) remain strictly isolated to the individual user. They are never exposed across organization memberships.

## 2. Models
1. `OrganizationModel.js`:
   - `name`: String, required, trim
   - `slug`: String, unique, lowercase
   - `owner`: ObjectId, ref 'User', required
   - `description`: String
   - timestamps
2. `MembershipModel.js`:
   - `organization`: ObjectId, ref 'Organization', required, index
   - `user`: ObjectId, ref 'User', required, index
   - `role`: Enum `['OWNER', 'ADMIN', 'RESEARCHER', 'VIEWER']`, default `'RESEARCHER'`
   - `invitedBy`: ObjectId, ref 'User'
   - `status`: Enum `['INVITED', 'ACTIVE', 'DECLINED']`, default `'ACTIVE'`
   - timestamps
   - Unique index on `{ organization: 1, user: 1 }`

## 3. Services & Controllers
- `organizationService.js`:
  - `createOrganization(userId, data)`: Creates org, automatically adds creator as `OWNER` in `MembershipModel`.
  - `getUserOrganizations(userId)`: Lists organizations the user belongs to with role.
  - `getOrganizationById(userId, orgId)`: Enforces membership check before returning details and members.
  - `inviteMember(userId, orgId, inviteData)`: Enforces `OWNER` or `ADMIN` role check.
  - `updateMemberRole(userId, orgId, memberId, newRole)`: Enforces `OWNER` or `ADMIN` role check; prevents changing owner unless ownership is transferred.
  - `removeMember(userId, orgId, memberId)`: Enforces `OWNER` / `ADMIN` role check or self-removal (leaving org); prevents removing the sole owner.
- `organizationController.js`:
  - Handlers for all org endpoints.
- `organizationRoutes.js`:
  - `POST /api/v1/organizations`
  - `GET /api/v1/organizations`
  - `GET /api/v1/organizations/:id`
  - `POST /api/v1/organizations/:id/invitations`
  - `PATCH /api/v1/organizations/:id/members/:memberId`
  - `DELETE /api/v1/organizations/:id/members/:memberId`

## 4. Test Suite
- `backend/test_mvp55.js`:
  - Org creation & owner assignment
  - RBAC verification (ADMIN vs RESEARCHER vs VIEWER)
  - Invitation and role change
  - Removal / Leaving organization
  - Organization isolation (User outside org cannot access org)
  - Private data protection (User portfolio and virtualBalance never leaked to teammates)
  - Zero financial ledger mutation

## 5. Regression Check
- Run `test_mvp1` through `test_mvp54` (or representative suite) after MVP-55.
