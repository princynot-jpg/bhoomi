import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import {
  validateCollectionName,
  validateFindInput,
  type MongoReader,
} from "../src/mcp/mongo-client.js";
import { createMongoMcpServer } from "../src/mcp/mongo-server.js";

const clients: Client[] = [];
const servers: ReturnType<typeof createMongoMcpServer>[] = [];

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("MongoDB MCP read-only tools", () => {
  it("registers MongoDB status, collection, and sample tools", async () => {
    const fakeMongo: MongoReader = {
      async status() {
        return { connected: true, database: "nlams-test" };
      },
      async listCollections() {
        return ["users", "refreshsessions"];
      },
      async inspectCollection(name) {
        return {
          name,
          estimatedDocuments: 2,
          indexes: [{ name: "_id_", keys: { _id: 1 }, unique: true }],
        };
      },
      async findDocuments(name, filter, fields, limit) {
        return [{ name: "Test User", collection: name, filter, fields, limit }];
      },
      async close() {},
    };
    const server = createMongoMcpServer(fakeMongo);
    servers.push(server);
    const client = new Client({ name: "mongo-test-client", version: "1.0.0" });
    clients.push(client);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual([
      "nlams_mongo_status",
      "nlams_mongo_list_collections",
      "nlams_mongo_inspect_collection",
      "nlams_mongo_find_documents",
    ]);

    const status = await client.callTool({
      name: "nlams_mongo_status",
      arguments: {},
    });
    expect(status.isError).not.toBe(true);
    expect(status.content[0]?.text).toContain("nlams-test");

    const sample = await client.callTool({
      name: "nlams_mongo_find_documents",
      arguments: {
        collection: "users",
        filter: { role: "LRB" },
        fields: ["name", "role"],
        limit: 5,
      },
    });
    expect(sample.isError).not.toBe(true);
    expect(sample.content[0]?.text).toContain('"role": "LRB"');
  });

  it("rejects operators, secret fields, unsafe collection names, and oversized samples", () => {
    expect(() => validateCollectionName("system.users")).toThrow(/restricted/);
    expect(() => validateCollectionName("../users")).toThrow(/restricted/);
    expect(() => validateFindInput({ $where: "return true" }, [], 10)).toThrow(/not allowed/);
    expect(() => validateFindInput({ passwordHash: "hash" }, [], 10)).toThrow(/not allowed/);
    expect(() => validateFindInput({}, ["refreshToken"], 10)).toThrow(/invalid or restricted/);
    expect(() => validateFindInput({}, [], 21)).toThrow(/between 1 and 20/);
    expect(() => validateFindInput({ role: { $ne: "LRB" } }, [], 10)).toThrow(/scalar equality/);
  });

  it("accepts only scalar equality filters", () => {
    expect(validateFindInput(
      { role: "LRB", isActive: true, attempts: 2, deletedAt: null },
      ["name", "role"],
      10,
    )).toEqual({
      filter: { role: "LRB", isActive: true, attempts: 2, deletedAt: null },
      fields: ["name", "role"],
      limit: 10,
    });
  });
});
