const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const nodeEnv = process.env.NODE_ENV || "development";
const accessSecret = process.env.JWT_ACCESS_SECRET || "development-access-secret-change-before-launch-123456";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "development-refresh-secret-change-before-launch-654321";

if (nodeEnv === "production" && (accessSecret.startsWith("development-") || refreshSecret.startsWith("development-"))) {
  throw new Error("Secure JWT_ACCESS_SECRET and JWT_REFRESH_SECRET values are required in production.");
}

module.exports = {
  nodeEnv,
  port: Number(process.env.PORT || 8080),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pms",
  clientUrl: process.env.CLIENT_URL || (nodeEnv === "production" ? "" : "http://localhost:5173"),
  accessSecret,
  refreshSecret,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  isProduction: nodeEnv === "production"
};
