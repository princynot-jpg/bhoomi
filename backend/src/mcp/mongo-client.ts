import mongoose, { type Connection } from "mongoose";

const hiddenFields = new Set([
  "__v",
  "passwordHash",
  "googleId",
  "tokenHash",
  "refreshToken",
]);
const unsafeFieldNames = new Set(["__proto__", "constructor", "prototype"]);
const maxFilterFields = 12;
const maxFieldNameLength = 120;
const maxStringValueLength = 500;
const maxSampleLimit = 20;
const validCollectionName = /^[a-zA-Z0-9_-]{1,120}$/;

export interface CollectionSummary {
  name: string;
  estimatedDocuments: number;
  indexes: Array<{
    name: string;
    keys: Record<string, number>;
    unique: boolean;
    expireAfterSeconds?: number;
  }>;
}

export interface MongoReader {
  status(): Promise<{ connected: boolean; database: string | null }>;
  listCollections(): Promise<string[]>;
  inspectCollection(name: string): Promise<CollectionSummary>;
  findDocuments(
    name: string,
    filter: Record<string, string | number | boolean | null>,
    fields: string[],
    limit: number,
  ): Promise<unknown[]>;
  close(): Promise<void>;
}

export function validateCollectionName(name: string): string {
  if (!validCollectionName.test(name) || name.startsWith("system")) {
    throw new Error("Invalid or restricted collection name.");
  }
  return name;
}

function isRestrictedField(field: string): boolean {
  const normalized = field.toLowerCase();
  return unsafeFieldNames.has(normalized)
    || field.startsWith("$")
    || field.includes(".")
    || hiddenFields.has(field)
    || /(password|token|secret|credential)/i.test(field);
}

export function validateFindInput(
  filter: Record<string, unknown>,
  fields: string[],
  limit: number,
): {
  filter: Record<string, string | number | boolean | null>;
  fields: string[];
  limit: number;
} {
  const entries = Object.entries(filter);
  if (entries.length > maxFilterFields) {
    throw new Error(`Filters may contain at most ${maxFilterFields} fields.`);
  }

  const safeFilter: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of entries) {
    if (
      key.length > maxFieldNameLength
      || isRestrictedField(key)
    ) {
      throw new Error(`Filter field "${key}" is not allowed.`);
    }
    if (
      value !== null
      && typeof value !== "string"
      && typeof value !== "number"
      && typeof value !== "boolean"
    ) {
      throw new Error("Filters only support scalar equality values.");
    }
    if (typeof value === "string" && value.length > maxStringValueLength) {
      throw new Error("Filter string values must not exceed 500 characters.");
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error("Filter numbers must be finite.");
    }
    safeFilter[key] = value;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > maxSampleLimit) {
    throw new Error(`Sample limit must be between 1 and ${maxSampleLimit}.`);
  }

  const safeFields = [...new Set(fields)];
  if (safeFields.some((field) =>
    field.length > maxFieldNameLength || isRestrictedField(field)
  )) {
    throw new Error("Requested fields contain an invalid or restricted field.");
  }

  return { filter: safeFilter, fields: safeFields, limit };
}

export class MongooseReadOnlyClient implements MongoReader {
  private connection: Connection | undefined;
  private readonly uri: string;
  private readonly databaseName: string;

  constructor(
    uri = process.env.MCP_MONGODB_URI?.trim() || process.env.MONGODB_URI,
  ) {
    if (!uri || !/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
      throw new Error(
        "Set MCP_MONGODB_URI or MONGODB_URI in backend/.env to a MongoDB connection URI.",
      );
    }
    this.uri = uri;
    try {
      this.databaseName = new URL(uri).pathname.slice(1).split("?")[0] || "default";
    } catch {
      this.databaseName = "configured database";
    }
  }

  private async getConnection(): Promise<Connection> {
    if (!this.connection) {
      this.connection = mongoose.createConnection(this.uri, {
        connectTimeoutMS: 8_000,
        serverSelectionTimeoutMS: 8_000,
        socketTimeoutMS: 8_000,
        maxPoolSize: 2,
        readPreference: "secondaryPreferred",
      });
      try {
        await this.connection.asPromise();
      } catch {
        this.connection = undefined;
        throw new Error(
          "Could not connect to MongoDB. Check that the MongoDB service is running and the MCP database URI is configured.",
        );
      }
    }
    return this.connection;
  }

  async status(): Promise<{ connected: boolean; database: string | null }> {
    if (this.connection?.readyState === 1) {
      return {
        connected: true,
        database: this.connection.name || this.databaseName,
      };
    }
    await this.getConnection();
    return {
      connected: true,
      database: this.connection?.name || this.databaseName,
    };
  }

  async listCollections(): Promise<string[]> {
    const connection = await this.getConnection();
    const collections = await connection.db?.listCollections({}, { nameOnly: true }).toArray();
    if (!collections) {
      throw new Error("MongoDB connection has no selected database.");
    }
    return collections
      .map(({ name }) => name)
      .filter((name) => !name.startsWith("system"))
      .sort();
  }

  async inspectCollection(name: string): Promise<CollectionSummary> {
    validateCollectionName(name);
    const connection = await this.getConnection();
    const collection = connection.db?.collection(name);
    if (!collection) {
      throw new Error("MongoDB connection has no selected database.");
    }

    const [estimatedDocuments, indexes] = await Promise.all([
      collection.estimatedDocumentCount(),
      collection.indexes(),
    ]);

    return {
      name,
      estimatedDocuments,
      indexes: indexes.map((index) => ({
        name: index.name ?? "unnamed",
        keys: index.key as Record<string, number>,
        unique: index.unique === true,
        ...(typeof index.expireAfterSeconds === "number"
          ? { expireAfterSeconds: index.expireAfterSeconds }
          : {}),
      })),
    };
  }

  async findDocuments(
    name: string,
    filter: Record<string, string | number | boolean | null>,
    fields: string[],
    limit: number,
  ): Promise<unknown[]> {
    validateCollectionName(name);
    const safeInput = validateFindInput(filter, fields, limit);
    const connection = await this.getConnection();
    const collection = connection.db?.collection(name);
    if (!collection) {
      throw new Error("MongoDB connection has no selected database.");
    }

    const projection = safeInput.fields.length > 0
      ? Object.fromEntries(safeInput.fields.map((field) => [field, 1]))
      : undefined;
    const documents = await collection
      .find(safeInput.filter, {
        ...(projection ? { projection } : {}),
      })
      .limit(safeInput.limit)
      .toArray();

    return documents.map((document) => {
      const safeDocument = { ...document };
      for (const field of hiddenFields) {
        delete safeDocument[field];
      }
      for (const field of Object.keys(safeDocument)) {
        if (/(password|token|secret|credential)/i.test(field)) {
          delete safeDocument[field];
        }
      }
      return safeDocument;
    });
  }

  async close(): Promise<void> {
    if (this.connection) {
      const connection = this.connection;
      this.connection = undefined;
      await connection.close();
    }
  }
}
