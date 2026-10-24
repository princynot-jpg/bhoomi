import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createNlamsMcpServer } from "./mcp/server.js";

const server = createNlamsMcpServer();
const transport = new StdioServerTransport();

void server.connect(transport).catch((error: unknown) => {
  console.error(
    "NLAMS MCP server failed to start:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
