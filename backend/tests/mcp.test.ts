import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { LocalApiClient, validateApiPath } from "../src/mcp/api-client.js";
import { createNlamsMcpServer } from "../src/mcp/server.js";

const servers: Server[] = [];
const clients: Client[] = [];
const mcpServers: ReturnType<typeof createNlamsMcpServer>[] = [];

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
  await Promise.all(mcpServers.splice(0).map((server) => server.close()));
  await Promise.all(servers.splice(0).map(
    (server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  ));
});

describe("NLAMS API testing MCP server", () => {
  it("exposes tools and calls the configured local API", async () => {
    const api = createServer((request, response) => {
      if (request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ success: true, data: { status: "ok" } }));
        return;
      }
      response.writeHead(503, { "content-type": "application/json" });
      response.end(JSON.stringify({ success: false, error: { code: "NOT_READY" } }));
    });
    servers.push(api);
    await new Promise<void>((resolve) => api.listen(0, "127.0.0.1", resolve));
    const { port } = api.address() as AddressInfo;

    const mcpServer = createNlamsMcpServer(
      new LocalApiClient(`http://127.0.0.1:${port}`),
    );
    mcpServers.push(mcpServer);
    const client = new Client({ name: "test-client", version: "1.0.0" });
    clients.push(client);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await mcpServer.connect(serverTransport);
    await client.connect(clientTransport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual([
      "nlams_health",
      "nlams_api_request",
    ]);

    const result = await client.callTool({
      name: "nlams_api_request",
      arguments: { method: "GET", path: "/health" },
    });
    expect(result.isError).toBe(false);
    expect(result.content[0]?.text).toContain('"status": 200');
    expect(result.content[0]?.text).toContain('"status": "ok"');
  });

  it("rejects non-loopback targets and paths outside the API", () => {
    expect(() => new LocalApiClient("http://example.com")).toThrow(/localhost/);
    expect(() => new LocalApiClient("https://127.0.0.1:5000")).toThrow(/http URL/);
    expect(() => validateApiPath("http://example.com/health")).toThrow(/starting with/);
    expect(() => validateApiPath("/../../etc/passwd")).toThrow(/Only/);
    expect(validateApiPath("/api/v1/auth/login")).toBe("/api/v1/auth/login");
  });
});
