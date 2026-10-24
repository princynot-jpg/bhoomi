const allowedMethods = ["GET", "POST", "PATCH"] as const;
export type ApiMethod = (typeof allowedMethods)[number];

const allowedBaseHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const responseLimit = 24_000;

function parseBaseUrl(baseUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("MCP_API_BASE_URL must be a valid loopback URL.");
  }

  if (
    parsed.protocol !== "http:"
    || !allowedBaseHosts.has(parsed.hostname)
    || parsed.username
    || parsed.password
    || parsed.pathname !== "/"
    || parsed.search
    || parsed.hash
  ) {
    throw new Error(
      "MCP_API_BASE_URL must be an http URL on localhost, 127.0.0.1, or ::1 without a path.",
    );
  }

  return parsed;
}

export function validateApiPath(path: string): string {
  if (
    path.length > 500
    || !path.startsWith("/")
    || path.startsWith("//")
    || path.includes("\\")
    || path.includes("#")
  ) {
    throw new Error("Path must be a local API route starting with a single slash.");
  }

  const parsed = new URL(path, "http://localhost");
  const normalizedPath = decodeURIComponent(parsed.pathname);
  if (
    normalizedPath.split("/").some((segment) => segment === "." || segment === "..")
    || !(normalizedPath === "/health"
      || normalizedPath === "/ready"
      || /^\/api\/v1\/[a-z0-9/_-]+$/i.test(normalizedPath))
  ) {
    throw new Error("Only /health, /ready, and /api/v1 routes can be tested.");
  }

  return `${parsed.pathname}${parsed.search}`;
}

export class LocalApiClient {
  private readonly baseUrl: URL;
  private accessToken: string | undefined;
  private refreshCookie: string | undefined;

  constructor(baseUrl = process.env.MCP_API_BASE_URL ?? "http://127.0.0.1:5000") {
    this.baseUrl = parseBaseUrl(baseUrl);
  }

  async request(
    method: ApiMethod,
    path: string,
    body?: Record<string, unknown>,
    authenticated = true,
  ): Promise<{ status: number; ok: boolean; body: unknown }> {
    if (!allowedMethods.includes(method)) {
      throw new Error("Only GET, POST, and PATCH requests are supported.");
    }

    const safePath = validateApiPath(path);
    const requestBody = body === undefined ? undefined : JSON.stringify(body);
    if (requestBody && Buffer.byteLength(requestBody, "utf8") > 10_000) {
      throw new Error("Request body must not exceed 10 KB.");
    }
    if (method === "GET" && requestBody !== undefined) {
      throw new Error("GET requests cannot include a JSON body.");
    }

    const headers = new Headers({ accept: "application/json" });
    if (requestBody !== undefined) {
      headers.set("content-type", "application/json");
    }
    if (authenticated && this.accessToken) {
      headers.set("authorization", `Bearer ${this.accessToken}`);
    }
    if (this.refreshCookie) {
      headers.set("cookie", `refreshToken=${this.refreshCookie}`);
    }

    let response: Response;
    try {
      response = await fetch(new URL(safePath, this.baseUrl), {
        method,
        headers,
        ...(requestBody !== undefined ? { body: requestBody } : {}),
        signal: AbortSignal.timeout(10_000),
        redirect: "error",
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown connection error";
      throw new Error(`Could not reach the local NLAMS API: ${reason}`);
    }

    this.updateRefreshCookie(response.headers.getSetCookie());
    const text = await response.text();
    let resultBody: unknown = text;
    try {
      resultBody = JSON.parse(text) as unknown;
    } catch {
      resultBody = text;
    }

    if (typeof resultBody === "object" && resultBody !== null) {
      const data = "data" in resultBody ? resultBody.data : undefined;
      if (
        typeof data === "object"
        && data !== null
        && "accessToken" in data
        && typeof data.accessToken === "string"
      ) {
        this.accessToken = data.accessToken;
      }
    }
    if (safePath.startsWith("/api/v1/auth/logout")) {
      this.accessToken = undefined;
      this.refreshCookie = undefined;
    }

    const serialized = JSON.stringify(resultBody);
    if (serialized.length > responseLimit) {
      resultBody = `${serialized.slice(0, responseLimit)}… [response truncated]`;
    }

    return { status: response.status, ok: response.ok, body: resultBody };
  }

  private updateRefreshCookie(setCookies: string[]): void {
    for (const cookie of setCookies) {
      const match = /^refreshToken=([^;]*)/i.exec(cookie);
      if (!match) {
        continue;
      }

      this.refreshCookie = match[1] || undefined;
    }
  }
}
