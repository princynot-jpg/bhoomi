import { createServer } from "node:http";
import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const server = createServer(app);

async function start(): Promise<void> {
  await connectDatabase();
  server.listen(env.PORT, () => {
    const healthUrl = `http://localhost:${env.PORT}/health`;
    logger.info("API server listening", { port: env.PORT });
    console.log(`\n  Open NLAMS API health: ${healthUrl}\n`);
  });
}

async function shutdown(signal: string): Promise<void> {
  logger.info("Shutting down API server", { signal });
  server.close(async (error) => {
    if (error) {
      logger.error("HTTP server shutdown failed", { error: error.message });
      process.exitCode = 1;
    }
    await disconnectDatabase();
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void start().catch((error: unknown) => {
  logger.error("API server failed to start", {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  process.exitCode = 1;
});
