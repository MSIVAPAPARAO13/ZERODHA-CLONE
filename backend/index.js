require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const portfolioRoutes = require("./routes/portfolioRoutes");
const orderRoutes = require("./routes/orderRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Security and Logging
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

// Body Parser
app.use(express.json());

// Production Request ID and Structured Logging Tracking
app.use((req, res, next) => {
  const reqId = req.headers["x-request-id"] || require("crypto").randomUUID();
  req.requestId = reqId;
  res.setHeader("X-Request-Id", reqId);
  next();
});

// Production Health Checks
const mongoose = require("mongoose");
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health/detailed", (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? "HEALTHY" : "DEGRADED";
  res.status(200).json({
    status: dbState === "HEALTHY" ? "ok" : "degraded",
    timestamp: new Date(),
    services: {
      database: { status: dbState },
      marketProvider: { status: "HEALTHY", provider: process.env.MARKET_DATA_PROVIDER || "mock" },
      aiProvider: { status: "HEALTHY" }
    }
  });
});

// Routes
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const accountRoutes = require("./routes/accountRoutes");
const marketRoutes = require("./routes/marketRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const alertRoutes = require("./routes/alertRoutes");
const journalRoutes = require("./routes/journalRoutes");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const playbookRoutes = require("./routes/playbookRoutes");
const marketEventRoutes = require("./routes/marketEventRoutes");
const scenarioRoutes = require("./routes/scenarioRoutes");
const strategyRoutes = require("./routes/strategyRoutes");
const strategyNotebookRoutes = require("./routes/strategyNotebookRoutes");
const scannerRoutes = require("./routes/scannerRoutes");
const researchRoutes = require("./routes/researchRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const insightsRoutes = require("./routes/insightsRoutes");
const decisionJournalRoutes = require("./routes/decisionJournalRoutes");
const sectorRoutes = require("./routes/sectorRoutes");
const learningCoachRoutes = require("./routes/learningCoachRoutes");
const automationRoutes = require("./routes/automationRoutes");
const digestRoutes = require("./routes/digestRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const usageRoutes = require("./routes/usageRoutes");
const billingRoutes = require("./routes/billingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const demoRoutes = require("./routes/demoRoutes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/portfolio", authMiddleware, portfolioRoutes);
app.use("/api/v1/orders", authMiddleware, orderRoutes);
app.use("/api/v1/account", authMiddleware, accountRoutes);
app.use("/api/v1/market", authMiddleware, marketRoutes);
app.use("/api/v1/sectors", authMiddleware, sectorRoutes);
app.use("/api/v1/market-events", authMiddleware, marketEventRoutes);
app.use("/api/v1/events", authMiddleware, eventsRoutes);
app.use("/api/v1/insights", authMiddleware, insightsRoutes);
app.use("/api/v1/decisions", authMiddleware, decisionJournalRoutes);
app.use("/api/v1/scenarios", authMiddleware, scenarioRoutes);
app.use("/api/v1/strategies", authMiddleware, strategyRoutes);
app.use("/api/v1/notebook", authMiddleware, strategyNotebookRoutes);
app.use("/api/v1/scanners", authMiddleware, scannerRoutes);
app.use("/api/v1/research", authMiddleware, researchRoutes);
app.use("/api/v1/watchlist", authMiddleware, watchlistRoutes);
app.use("/api/v1/alerts", authMiddleware, alertRoutes);
app.use("/api/v1/journal", authMiddleware, journalRoutes);
app.use("/api/v1/learning", authMiddleware, learningCoachRoutes);
app.use("/api/v1/automations", authMiddleware, automationRoutes);
app.use("/api/v1/digest", authMiddleware, digestRoutes);
app.use("/api/v1/organizations", authMiddleware, organizationRoutes);
app.use("/api/v1/collaboration", authMiddleware, collaborationRoutes);
app.use("/api/v1/usage", authMiddleware, usageRoutes);
app.use("/api/v1/billing", authMiddleware, billingRoutes);
app.use("/api/v1/admin", authMiddleware, adminRoutes);
app.use("/api/v1/demo", authMiddleware, demoRoutes);
app.use("/api/v1/ai", authMiddleware, aiRoutes);
app.use("/api/v1/analytics", authMiddleware, analyticsRoutes);
app.use("/api/v1/playbooks", authMiddleware, playbookRoutes);

// Fallback Route for non-existent routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Centralized Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

// Start Server & Connect to DB
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

startServer();