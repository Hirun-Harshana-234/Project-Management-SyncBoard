const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const boardRoutes = require("./routes/boardRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const requestRoutes = require("./routes/requestRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  const allowedOrigins = env.clientUrl.split(",").map((item) => item.trim()).filter(Boolean);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "same-origin" },
    contentSecurityPolicy: env.isProduction ? undefined : false
  }));
  if (allowedOrigins.length) {
    app.use(cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error("Origin is not allowed by CORS."));
      },
      credentials: true
    }));
  }
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: env.nodeEnv === "test" ? 1000 : 60, standardHeaders: "draft-8", legacyHeaders: false });
  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "pms-api", name: "PMS - Project Management SyncBoard", timestamp: new Date().toISOString() }));
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/boards", boardRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/requests", requestRoutes);

  const clientDist = path.resolve(__dirname, "../../client/dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { maxAge: "1d", index: false }));
    app.get("/{*splat}", (req, res, next) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/socket.io/")) return next();
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
