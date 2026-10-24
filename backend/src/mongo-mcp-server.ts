import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMongoMcpServer } from "./mcp/mongo-server.js";
import { MongooseReadOnlyClient } from "./mcp/mongo-client.js";

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(backendDirectory, ".env") });

const mongoClient = new MongooseReadOnlyClient();
const server = createMongoMcpServer(mongoClient);
const transport = new StdioServerTransport();
let isShuttingDown = false;

async function shutdown(): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  await server.close();
  await mongoClient.close();
}

process.stdin.once("end", () => {
  void shutdown().catch(() => {
    process.exitCode = 1;
  });
});
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

void server.connect(transport).catch((error: unknown) => {
  console.error(
    "NLAMS MongoDB MCP server failed to start:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
