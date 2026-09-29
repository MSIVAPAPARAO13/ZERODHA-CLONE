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

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/portfolio", authMiddleware, portfolioRoutes);
app.use("/api/v1/orders", authMiddleware, orderRoutes);
app.use("/api/v1/account", authMiddleware, accountRoutes);
app.use("/api/v1/market", authMiddleware, marketRoutes);
app.use("/api/v1/watchlist", authMiddleware, watchlistRoutes);
app.use("/api/v1/alerts", authMiddleware, alertRoutes);
app.use("/api/v1/journal", authMiddleware, journalRoutes);
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