# NLAMS Backend

TypeScript + Express API for the National Land Acquisition & Management System.

## Requirements

- Node.js 24 or later
- MongoDB (local instance or Atlas)

## Run locally

1. Copy `.env.example` to `.env` and replace both JWT secrets with distinct random values of at least 64 characters. On PowerShell, run this twice for two independent 96-character secrets:

   ```powershell
   $bytes = [byte[]]::new(48)
   [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
   [Convert]::ToHexString($bytes)
   ```

2. Install packages with `npm install`.
3. Start MongoDB.
4. Run `npm run dev`.
5. In VS Code, start the `nlams-api-test` and `nlams-mongodb-test` MCP servers
   from `.vscode/mcp.json`.

The API listens on port `5000` by default. Once it has connected to MongoDB,
the development terminal prints a clickable health-check URL
(`http://localhost:5000/health`). Database readiness is available at `GET /ready`.

## MCP API testing

This workspace provides a local-only stdio MCP server in `.vscode/mcp.json`.
After installing backend packages, start the backend and start the
`nlams-api-test` server in VS Code. It provides:

- `nlams_health` — checks `/health` and `/ready`.
- `nlams_api_request` — sends GET, POST, or PATCH requests to `/api/v1` routes
  (and the two health routes), returning status and response body.

Login/register access tokens and refresh cookies are retained in memory by that
MCP process for follow-up requests. Restart the MCP server to clear them.
The MCP target accepts only `localhost`, `127.0.0.1`, or `::1`, and requests
cannot be redirected to external hosts. Set `MCP_API_BASE_URL` to another
loopback port if the API is not running on port `5000`.

## MCP MongoDB testing

The separate `nlams-mongodb-test` server reads the MongoDB URI from
`MCP_MONGODB_URI`, falling back to `MONGODB_URI` in `backend/.env`. For safer
testing, set `MCP_MONGODB_URI` to a dedicated database user with read-only
permissions rather than using an administrative MongoDB account. The server
does not print or return connection credentials.

Available read-only tools:

- `nlams_mongo_status` — connect and show the database name.
- `nlams_mongo_list_collections` — list collection names.
- `nlams_mongo_inspect_collection` — show estimated document count and indexes.
- `nlams_mongo_find_documents` — sample up to 20 documents with scalar equality
  filters and optional field selection.

There are no write, delete, update, aggregation, or arbitrary MongoDB command
tools. Password hashes, OAuth IDs, refresh-token hashes, and other token fields
are excluded from samples. Start the server through **MCP: List Servers** in
VS Code after configuring MongoDB.

## Implemented routes

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create an LRB account |
| POST | `/api/v1/auth/login` | Authenticate and issue access/refresh tokens |
| POST | `/api/v1/auth/refresh` | Rotate the HttpOnly refresh cookie |
| POST | `/api/v1/auth/logout` | Revoke the refresh session |
| GET | `/api/v1/users/me` | Return the authenticated user's profile |
| PATCH | `/api/v1/users/me` | Update the authenticated user's profile and profile photo |
| GET, POST | `/api/v1/workspace/land-parcels` | List or register land parcels |
| PATCH | `/api/v1/workspace/land-parcels/:id/status` | Update a parcel's acquisition status |
| GET, POST | `/api/v1/workspace/compensation` | List or register compensation awards |
| PATCH | `/api/v1/workspace/compensation/:id/status` | Update a compensation status |
| GET, POST | `/api/v1/workspace/rehabilitation` | List or register rehabilitation cases |
| PATCH | `/api/v1/workspace/rehabilitation/:id/status` | Update a rehabilitation status |

The access token is returned in the response body and should be held in memory by
the frontend. The refresh token is an HttpOnly, SameSite=Strict cookie. Signup
does not accept a role; privileged roles need a future trusted provisioning
workflow. Passwords require at least 8 characters and are hashed with bcrypt.
Signed-in users can edit their name, position, state, district, and JPEG profile
photo from the sidebar. Profile photos are resized in the browser and stored
with the user's profile.
Workspace routes require a bearer access token. Lists and status updates are
restricted to the authenticated user's state and district, except that central
and administrator roles can list across locations. Creating a record requires
an account with both a state and district assigned; records are assigned those
values by the API rather than trusting location fields from the request.

## Scripts

- `npm run dev` — development server with restart-on-change
- `npm run mcp:mongodb` — start the MongoDB testing MCP server over stdio
- `npm run build` — compile to `dist/`
- `npm start` — start the compiled server
- `npm run typecheck` — strict TypeScript check
- `npm test` — API foundation tests

The workspace currently stores and tracks parcel, compensation, and
rehabilitation records. GIS boundaries, full proposal lifecycle persistence,
documents, Google OAuth, dashboards, sockets, notifications, and audit event
persistence remain for subsequent backend milestones. The dashboard's project
workflow dialog presents the current stage progression for the illustrative
proposal register.
