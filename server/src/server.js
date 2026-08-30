const http = require("http");
const env = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { createApp } = require("./app");
const { attachSocketServer } = require("./services/socketServer");
const { ensureDemoWorkspace } = require("./seed");

async function start() {
  await connectDatabase();
  await ensureDemoWorkspace();
  const app = createApp();
  const server = http.createServer(app);
  attachSocketServer(server);
  server.listen(env.port, () => console.log(`PMS is running on port ${env.port}`));

  async function shutdown(signal) {
    console.log(`${signal} received. Shutting down safely.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  }
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("Unable to start PMS:", error);
  process.exit(1);
});
