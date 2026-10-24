import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LocalApiClient, type ApiMethod } from "./api-client.js";

const apiPathSchema = z.string().min(1).max(500);

function formatResult(result: { status: number; ok: boolean; body: unknown }) {
  return {
    isError: !result.ok,
    content: [{
      type: "text" as const,
      text: JSON.stringify(result, null, 2),
    }],
  };
}

export function createNlamsMcpServer(apiClient = new LocalApiClient()): McpServer {
  const server = new McpServer(
    { name: "nlams-api-test", version: "1.0.0" },
    {
      instructions:
        "Test the local NLAMS Express API only. Start the backend with npm run dev first. "
        + "Login/register responses automatically retain the access token and refresh cookie "
        + "for subsequent requests in this MCP session.",
    },
  );

  server.registerTool(
    "nlams_health",
    {
      title: "Check NLAMS API health",
      description: "Check local API liveness and MongoDB readiness.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const [health, readiness] = await Promise.all([
        apiClient.request("GET", "/health", undefined, false),
        apiClient.request("GET", "/ready", undefined, false),
      ]);
      return formatResult({
        status: health.ok && readiness.ok ? 200 : readiness.status,
        ok: health.ok && readiness.ok,
        body: { health, readiness },
      });
    },
  );

  server.registerTool(
    "nlams_api_request",
    {
      title: "Call a local NLAMS API route",
      description:
        "Send a GET, POST, or PATCH request to /api/v1 routes or /health and /ready. "
        + "Only localhost is supported. Authentication from login/register is reused automatically.",
      inputSchema: {
        method: z.enum(["GET", "POST", "PATCH"]),
        path: apiPathSchema,
        body: z.record(z.string(), z.unknown()).optional(),
        authenticated: z.boolean().default(true),
      },
      annotations: { openWorldHint: false },
    },
    async ({ method, path, body, authenticated }) => {
      const result = await apiClient.request(
        method as ApiMethod,
        path,
        body,
        authenticated,
      );
      return formatResult(result);
    },
  );

  return server;
}
