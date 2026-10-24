import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MongoReader } from "./mongo-client.js";

const scalarFilterValue = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

function successResult(data: unknown) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ success: true, data }, null, 2),
    }],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  const safeMessage = message.startsWith("Set ")
    || message.startsWith("Invalid ")
    || message.startsWith("Filters ")
    || message.startsWith("Filter ")
    || message.startsWith("Requested ")
    || message.startsWith("Sample ")
    ? message
    : "MongoDB read failed. Check the connection, database permissions, and collection name.";

  return {
    isError: true,
    content: [{ type: "text" as const, text: safeMessage }],
  };
}

async function withSafeErrors<T>(
  action: () => Promise<T>,
  format: (result: T) => ReturnType<typeof successResult> = successResult,
) {
  try {
    return format(await action());
  } catch (error) {
    return errorResult(error);
  }
}

export function createMongoMcpServer(mongo: MongoReader): McpServer {
  const server = new McpServer(
    { name: "nlams-mongodb-test", version: "1.0.0" },
    {
      instructions:
        "Read-only tools for inspecting the configured NLAMS MongoDB database. "
        + "No write, delete, update, command execution, or aggregation tools are exposed. "
        + "Document samples are limited to 20 and credential/token fields are always redacted.",
    },
  );

  server.registerTool(
    "nlams_mongo_status",
    {
      title: "Check NLAMS MongoDB connection",
      description: "Connect to MongoDB and return connection status and database name only.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => withSafeErrors(() => mongo.status()),
  );

  server.registerTool(
    "nlams_mongo_list_collections",
    {
      title: "List NLAMS collections",
      description: "List collection names in the configured NLAMS database.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => withSafeErrors(() => mongo.listCollections()),
  );

  server.registerTool(
    "nlams_mongo_inspect_collection",
    {
      title: "Inspect MongoDB collection",
      description: "Return an estimated document count and index metadata for one collection.",
      inputSchema: {
        collection: z.string().min(1).max(120),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ collection }) =>
      withSafeErrors(() => mongo.inspectCollection(collection)),
  );

  server.registerTool(
    "nlams_mongo_find_documents",
    {
      title: "Find sample MongoDB documents",
      description:
        "Read at most 20 documents using scalar equality filters. "
        + "Specify fields to limit returned data; credential/token fields are always removed.",
      inputSchema: {
        collection: z.string().min(1).max(120),
        filter: z.record(z.string(), scalarFilterValue).default({}),
        fields: z.array(z.string().min(1).max(120)).max(30).default([]),
        limit: z.number().int().min(1).max(20).default(10),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ collection, filter, fields, limit }) =>
      withSafeErrors(() => mongo.findDocuments(collection, filter, fields, limit)),
  );

  return server;
}
