# TRADEFLOW — PRODUCTION DEPLOYMENT GUIDE
**Release Target**: 2.0-PRODUCTION RELEASE  
**Architecture**: MERN Stack (React 18 Dashboard + Node/Express Backend + MongoDB Atlas + TwelveData / AlphaVantage / Gemini AI)  
**Target Hosting**: Backend on Render / Fly.io / Railway; Frontend on Vercel / Netlify; Database on MongoDB Atlas  

---

## 1. Prerequisites

Before initiating deployment, ensure you possess:
- **Node.js**: Version 20.x or 22.x LTS (tested up to v24).
- **npm**: Version 10.x+.
- **MongoDB Atlas**: An active cluster running MongoDB 6.0+ with Replica Set enabled (mandatory for multi-document ACID transactions).
- **Third-Party API Keys**:
  - TwelveData API key (Primary market data provider).
  - AlphaVantage API key (Secondary fallback provider).
  - Google Gemini API key (LLM Copilot & Research Agent reasoning).
- **Hosting Accounts**: Render / Railway (Backend) and Vercel / Netlify (Frontend Dashboard).

---

## 2. Environment Variables Configuration

### Backend Environment Variables (`backend/.env`)
Create production environment variables in your hosting dashboard matching `backend/.env.production.example`:

```bash
NODE_ENV=production
PORT=3002

# MongoDB Atlas URI (Must include replicaSet / retryWrites for transactions)
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tradeflow?retryWrites=true&w=majority&appName=TradeFlowProd

# Cryptographically Secure Auth Secret (e.g. openssl rand -base64 32)
JWT_SECRET=c3f6e18b849204892c90e0c12850982df092147395018b3e8d910294719280ef
JWT_EXPIRES_IN=7d

# Allowed Frontend Origins (Comma-separated for CORS)
FRONTEND_URL=https://tradeflow-app.vercel.app

# Market Data Providers
MARKET_DATA_PROVIDER=twelvedata
TWELVE_DATA_API_KEY=your_twelvedata_api_key
ALPHA_VANTAGE_API_KEY=your_alphavantage_api_key

# Grounded AI Intelligence
GEMINI_API_KEY=your_gemini_api_key

# Logging & Observability
LOG_LEVEL=info
```

### Frontend Environment Variables (`dashboard/.env`)
```bash
REACT_APP_API_URL=https://tradeflow-api.onrender.com/api/v1
```

---

## 3. Database Setup (MongoDB Atlas)

1. **Network Access**: Configure IP Access List in MongoDB Atlas:
   - For Render/Vercel serverless egress, allow `0.0.0.0/0` with strong database user credentials.
2. **Database User**: Create a user with `readWriteAnyDatabase` or scoped to `tradeflow` with session support.
3. **Indexes**:
   Indexes are automatically initialized on startup by Mongoose schemas. Key composite indexes include:
   - `idempotencykeys`: `{ user: 1, key: 1 }` (unique), `{ createdAt: 1 }` (24h TTL)
   - `orders`: `{ user: 1, createdAt: -1 }`
   - `holdings`: `{ user: 1, name: 1 }` (unique)
   - `transactions`: `{ user: 1, createdAt: -1 }`
   - `memberships`: `{ organization: 1, user: 1 }` (unique)
   - `automations`: `{ user: 1, type: 1, enabled: 1 }`

---

## 4. Backend Deployment (e.g., Render / Fly.io)

### Configuration
- **Root Directory**: `backend`
- **Build Command**: `npm ci --production`
- **Start Command**: `node index.js`
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Enabled on `main` branch.

### Verification Steps
Once deployed, verify:
```bash
curl https://tradeflow-api.onrender.com/api/health
# Response: {"status":"ok"}

curl https://tradeflow-api.onrender.com/api/health/detailed
# Response: {"status":"ok","services":{"database":{"status":"HEALTHY"},"marketProvider":{"status":"HEALTHY"},"aiProvider":{"status":"HEALTHY"}}}
```

---

## 5. Frontend Deployment (e.g., Vercel)

### Configuration
- **Root Directory**: `dashboard`
- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Environment Variables**: Set `REACT_APP_API_URL` to your production backend URL.

### Single Page Application (SPA) Routing Rule (`vercel.json`)
Ensure routing rewrites are configured in `dashboard/vercel.json` (or `_redirects` for Netlify) to handle client-side routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 6. Security & CORS Configuration

In `backend/index.js`, CORS is enabled with explicit header allowance:
```javascript
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Request-Id"]
}));
```

---

## 7. Rollback & Disaster Recovery Strategy

1. **Backend Rollback**: Render / Fly.io support 1-click instantaneous rollback to the prior release container image.
2. **Database Snapshots**:
   - MongoDB Atlas provides continuous point-in-time recovery (PITR) up to 7 days.
   - For major version migrations, create an on-demand snapshot in the Atlas console prior to release.
3. **Data Verification**:
   After any deployment or recovery, run the read-only integrity checker:
   ```bash
   node final_data_integrity_check.js
   ```

---

## 8. Common Troubleshooting & Operational Runbook

| Symptom | Probable Cause | Action / Resolution |
|---|---|---|
| **500 on Order Creation** | MongoDB replica set offline or transaction failed. | Verify Atlas cluster is M10+ or serverless with replica set enabled; verify user balance is positive. |
| **409 Conflict on Orders** | Idempotent key already locked or processed. | Check `Idempotency-Key` header; client should generate a unique UUID per distinct logical order. |
| **404 on Symbol Quote** | Unknown ticker requested or provider rate limit. | Verify symbol exists in mock or TwelveData universe. System returns explicit `DATA_UNAVAILABLE` rather than fake data. |
| **401 Unauthorized** | Missing or expired JWT token. | Re-authenticate via `/api/v1/auth/login` to obtain fresh token; include `Bearer <token>` in Authorization header. |
| **CORS Block in Browser** | `FRONTEND_URL` mismatch. | Update backend `FRONTEND_URL` environment variable to match the exact Vercel deployment domain. |
