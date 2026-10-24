# PRD: Real-Time National Land Acquisition & Management System

**SIH Problem Code:** SIH26016 | **Sponsoring Organization:** Ministry of Rural Development | **Department:** Dept. of Land Resources (DoLR) | **Theme:** Smart Automation

**Stack:** React + Next.js (frontend), Tailwind CSS, Node.js + Express (backend), MongoDB (database)

---

## 1. Document Overview

**Purpose:** This PRD defines the product scope, architecture, data model, API contract, and engineering standards for building the National Land Acquisition & Management System (NLAMS) — a web-based platform digitizing the end-to-end land acquisition lifecycle from project proposal to final possession.

**Audience:** Hackathon team members, AI coding assistants, judges/evaluators, and future maintainers.

**Scope:** Full-stack web application (desktop + mobile-responsive) covering proposal submission, approvals, GIS-based geo-tagging, compensation/R&R tracking, notifications, and MIS dashboards. Out of scope for MVP: native mobile apps, offline-first field data collection (stub only), and blockchain-based land records (future consideration).

---

## 2. Problem Statement Summary

Land acquisition in India involves multiple stakeholders — land-requiring bodies, land acquiring authorities, district administrations, state governments, and central ministries. Today this runs on fragmented, state-specific, largely manual systems, causing inconsistent data, duplicated effort, approval delays, poor transparency, and weak monitoring. Decision-makers lack real-time visibility into proposal status, compensation disbursal, possession, and Rehabilitation & Resettlement (R&R) progress.

**Goal:** A unified, standardized, nationally-scalable digital platform that digitizes the complete lifecycle, enables role-based collaboration across agencies, geo-tags acquired parcels on GIS maps, and gives decision-makers real-time, data-driven dashboards.

---

## 3. Goals & Success Metrics

| Goal | Metric |
| --- | --- |
| Digitize proposal-to-possession workflow | 100% of proposals tracked digitally, zero paper-only approvals |
| Reduce processing time | ≥30% reduction in average proposal-to-award turnaround (baseline vs. platform) |
| Improve transparency | Real-time public/stakeholder dashboard live for every active project |
| GIS accuracy | 100% of acquired parcels geo-tagged with validated coordinates |
| Interoperability | API integrations live with at least one land-records / cadastral data source |
| Adoption | Pilot in ≥1 state/UT with ≥3 districts onboarded within pilot phase |

---

## 4. User Roles & Personas

| Role | Description | Key Actions |
| --- | --- | --- |
| **Land Requiring Body (LRB)** | Entity needing land (e.g. NHAI, Railways, state PWD) | Submits proposals, tracks status, views compensation/possession progress |
| **Land Acquiring Authority (LAA) / District Collector Office** | District-level authority executing acquisition | Scrutinizes proposals, issues notifications, approves awards, manages R&R |
| **State Government Official** | State-level nodal officer | Approves/escalates proposals, views state-wide dashboards, compliance checks |
| **Central Ministry Official (DoLR / Ministry of Rural Development)** | National oversight | Views national dashboard, sets policy parameters, monitors SLA adherence |
| **Project Implementing Agency (PIA)** | Executes the infrastructure project post-possession | Views possession status, milestone tracking |
| **Field Officer** | On-ground data collector/verifier | Mobile-responsive data entry: geo-tagging, document upload, R&R verification |
| **Affected Landowner / Displaced Family (view-only, future phase)** | Citizen stakeholder | Views own case status, compensation, grievance submission (phase 2) |
| **System Admin** | Platform administrator | User/role management, audit logs, system configuration |

---

## 5. Functional Requirements (Modules)

1. **Auth & Role Management** — Google OAuth + email/password login; role-based access control (RBAC) scoped per agency/state/district.
2. **Proposal Management** — Online submission, multi-stage digital scrutiny, document upload, approval workflow with configurable stages per state.
3. **Land Parcel & GIS Module** — Geo-tagging of parcels, interactive map visualization (survey numbers, boundaries), spatial search.
4. **Notification & Awards Engine** — Automated alerts for notifications issued, awards declared, deadline reminders (email + in-app + push).
5. **Compensation & Disbursement Tracking** — Compensation assessed vs. disbursed, payment status per landowner, audit trail.
6. **Possession Tracking** — Status per parcel (pending/in-progress/possessed), milestone timeline.
7. **Rehabilitation & Resettlement (R&R) Module** — Affected/displaced family records, R&R entitlement tracking, progress status.
8. **Project & State-wise Progress Dashboard** — Aggregated views: area notified/acquired, families affected, timeline adherence, SLA breaches.
9. **Document Repository** — Secure storage with version control and audit history for all case-related documents.
10. **MIS Reports & Analytics** — Customizable reports, exportable (CSV/PDF), predictive analytics for policy support (phase 2: ML-based delay prediction).
11. **API Integration Layer** — Interop with land records, cadastral maps, and relevant government systems via documented REST APIs.
12. **Audit & Compliance** — Full audit log of every state-changing action, data security compliant with government standards (encryption at rest/in transit).

---

## 6. Tech Stack

> ⚠️ **Version Safety Rule:** Never hardcode package versions from this document. Before writing `package.json`, web-search each dependency (`"<pkg> npm latest version"`, `"<pkg> npm security advisory"` / CVE) and confirm with `npm show <pkg> version`. Align Node.js with current **Active LTS**. Run `npm audit` before shipping.

| Layer | Choice | Notes |
| --- | --- | --- |
| **Runtime** | Node.js | Active LTS — verify via web search |
| **Backend framework** | Express | Latest stable — verify |
| **Language** | TypeScript (strict mode) | Both frontend and backend |
| **Frontend framework** | React + **Next.js** (App Router) | SSR/SSG for public dashboards, CSR for authenticated app shell |
| **Styling** | Tailwind CSS + CSS Modules where needed | Design tokens for gov-standard accessible UI |
| **Database** | MongoDB (Atlas) | Cloud-hosted; restricted DB user, IP allowlist |
| **ODM** | Mongoose | Schema validation + indexes |
| **Validation** | Zod | Env vars + request bodies + forms |
| **Auth** | Google OAuth + Email/Password | Passport.js strategies |
| **JWT** | jsonwebtoken | Access (15 min) + Refresh (7 days, rotated) |
| **Password hashing** | bcryptjs | Cost factor ≥10 |
| **Security headers** | helmet | CSP tuned for Next.js SPA |
| **CORS** | cors | Explicit origin allowlist |
| **Rate limiting** | express-rate-limit | Stricter on auth + public endpoints |
| **NoSQL sanitize** | express-mongo-sanitize | Injection prevention |
| **Real-time** | socket.io | Room-based: per-project, per-district channels |
| **Job scheduling** | node-cron | SLA breach checks, reminder dispatch |
| **Email** | nodemailer | Notification delivery |
| **GIS / Mapping** | Leaflet or Mapbox GL JS (react-map-gl) | Interactive parcel visualization |
| **Charts/Dashboards** | Recharts or Chart.js | MIS reports & dashboards |
| **Server state (frontend)** | TanStack Query | Caching, retries |
| **HTTP client** | Axios | Interceptor-based token refresh |
| **Forms** | React Hook Form + Zod | Validated multi-step forms |
| **HTML sanitize** | DOMPurify | For any rich-text/remarks fields |
| **Logging** | winston | Structured, redacted logs |
| **Monitoring** | @sentry/node (+ @sentry/nextjs) | Error tracking frontend + backend |
| **Deploy: Frontend** | Vercel | Next.js native |
| **Deploy: Backend** | Render / Railway | Env vars in dashboard |
| **Deploy: DB** | MongoDB Atlas | IP allowlist required |

**Token lifetime standard:** Access JWT 15 min (`Authorization: Bearer` header) · Refresh token 7 days (`HttpOnly; Secure; SameSite=Strict` cookie).

---

## 7. System Architecture Overview

```
[ Next.js Frontend (Vercel) ]
        |  Axios (withCredentials) + Socket.io client
        v
[ Express API (Render/Railway) ] --- JWT Auth, RBAC, Zod validation
        |            |                 |
        v            v                 v
[ MongoDB Atlas ] [ GIS/Map tiles ] [ External Gov APIs: land records, cadastral ]
        |
        v
[ node-cron jobs: SLA checks, reminders ] -> [ nodemailer / push / socket.io events ]
```

Key architectural decisions:

- **Next.js App Router** used for both the authenticated dashboard app and public-facing project-status pages (SSG/ISR for public transparency pages, which supports the platform's transparency goal).
- **Role-scoped data access**: every query filtered by the user's agency/state/district scope, enforced server-side via `roleGuard` middleware — never trust client-sent scope.
- **Event-driven notifications**: state transitions (e.g., award declared, compensation disbursed) emit domain events consumed by the notification service (email/push/socket) and the audit logger.
- **GIS data** stored as GeoJSON in MongoDB with a `2dsphere` index for spatial queries (parcel search within a district boundary, proximity, overlap checks).

---

## 8. Repository Structure

```
NLAMS/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   ├── config/ (env.ts, db.ts, passport.ts)
│   │   ├── middleware/ (requireAuth, validate, roleGuard, errorHandler)
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── proposals/
│   │   │   ├── parcels/            # GIS/geo-tagging
│   │   │   ├── notifications/
│   │   │   ├── compensation/
│   │   │   ├── possession/
│   │   │   ├── rnr/                # Rehabilitation & Resettlement
│   │   │   ├── documents/
│   │   │   ├── reports/
│   │   │   └── audit/
│   │   ├── services/ (email.service.ts, cron.service.ts, geo.service.ts)
│   │   ├── sockets/
│   │   ├── utils/ (jwt, encryption, ownershipCheck, tokenCompare)
│   │   └── types/
│   ├── postman/
│   ├── .env.example
│   └── tsconfig.json
│
├── frontend/ (Next.js App Router)
│   ├── app/
│   │   ├── (public)/ project/[id]/page.tsx     # public transparency page (SSG/ISR)
│   │   ├── (dashboard)/ proposals/, parcels/, compensation/, rnr/, reports/
│   │   ├── (auth)/ login/, callback/
│   │   └── layout.tsx
│   ├── lib/ (env.ts, api/client.ts, api/refreshClient.ts)
│   ├── auth/ (AuthProvider.tsx, tokenStore.ts)
│   ├── components/ (RequireAuth, ErrorBoundary, MapView, DashboardWidgets)
│   ├── features/<resource>/ (api.ts hooks, components/, types.ts)
│   ├── styles/ (tailwind.config.ts, globals.css)
│   └── .env.example
│
└── docs/ (this PRD, BACKEND_PLANNING.md)
```

**Rules:** Never commit `.env`, `node_modules`, `.next/`, `dist/`. Always commit `.env.example`. TypeScript strict mode on. One source of truth for env validation per app.

---

## 9. Environment Variables

### Backend `.env.example` (key additions beyond blueprint defaults)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nlamS
JWT_ACCESS_SECRET=replace_with_64_char_hex
JWT_REFRESH_SECRET=replace_with_different_64_char_hex
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
CLIENT_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
ENCRYPTION_KEY=replace_with_64_char_hex
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@nlams.gov.in
GIS_TILE_PROVIDER_KEY=            # Mapbox/Leaflet tile provider
LAND_RECORDS_API_BASE=            # external cadastral/land-records API
LAND_RECORDS_API_KEY=
SENTRY_DSN=
```

### Frontend `.env.example`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_MAP_TILE_KEY=
NEXT_PUBLIC_ENABLE_REAL_TIME=true
```

Both validated at startup/build with Zod (`env.ts`) — crash on misconfiguration rather than running with bad config.

---

## 10. Core Data Models (MongoDB / Mongoose)

**User**: `{ name, email, passwordHash?, googleId?, role: enum[LRB,LAA,STATE,CENTRAL,PIA,FIELD,ADMIN], agency, state, district, isActive }`

**Proposal**: `{ title, lrbId (ref User), projectType, description, stage: enum[DRAFT,SUBMITTED,UNDER_SCRUTINY,APPROVED,REJECTED], state, district, submittedAt, slaDeadline, documents: [ref Document], history: [{stage, actor, timestamp, remarks}] }`

**LandParcel**: `{ proposalId (ref), surveyNumber, geoJson: {type:'Polygon', coordinates}, areaProposed, areaAcquired, status: enum[PROPOSED,NOTIFIED,ACQUIRED,POSSESSED], ownerDetails: [...], district, state }` — `2dsphere` index on `geoJson`.

**Notification** (legal notification, not app alert): `{ parcelId, type: enum[SEC_11,SEC_19,AWARD], issuedDate, documentRef, status }`

**Award**: `{ parcelId, awardDate, compensationAssessed, compensationDisbursed, disbursementStatus: enum[PENDING,PARTIAL,PAID] }`

**Possession**: `{ parcelId, status: enum[PENDING,IN_PROGRESS,POSSESSED], possessionDate, verifiedBy }`

**RnRRecord**: `{ parcelId, familyId, headOfFamily, membersCount, entitlements: [...], status: enum[IDENTIFIED,VERIFIED,RESETTLED], resettlementSite }`

**Document**: `{ ownerType, ownerId, fileUrl, version, uploadedBy, uploadedAt, checksum }`

**AuditLog**: `{ actorId, action, resourceType, resourceId, before, after, timestamp, ip }`

**AppNotification** (in-app/email/push alert): `{ userId, type, message, relatedResource, read, createdAt }`

All primary collections use the **soft-delete pattern** (`isDeleted`, `deletedAt`) and are always queried scoped by the requester's `state`/`district`/`agency` via `roleGuard`.

---

## 11. API Documentation Standard

All endpoints follow this response shape:

```json
// Success
{ "success": true, "data": { ... } }
// Paginated
{ "success": true, "data": [...], "pagination": { "total":100, "page":1, "limit":20, "totalPages":5 } }
// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable", "fields": {} } }
```

### Sample: `POST /api/v1/proposals`

**Description:** LRB submits a new land acquisition proposal. **Auth required:** Yes · **Minimum role:** LRB

**Body:**

```json
{
  "title": "NH-130 Widening Phase 2",
  "projectType": "highway",
  "description": "...",
  "state": "Chhattisgarh",
  "district": "Ambikapur",
  "estimatedArea": 42.5
}
```

**201 Response:** `{ "success": true, "data": { "_id": "...", "stage": "SUBMITTED", ... } }`

### Sample: `GET /api/v1/parcels?district=&status=&bbox=`

**Description:** Returns parcels within a district and/or bounding box for map rendering (GeoJSON FeatureCollection). **Auth required:** Yes (read-scoped to requester's state/district)

### Sample: `PATCH /api/v1/awards/:id/disburse`

**Description:** Records a compensation disbursement against an award. **Auth required:** Yes · **Minimum role:** LAA **Business rule:** `compensationDisbursed` can never exceed `compensationAssessed`; partial payments update `disbursementStatus` to `PARTIAL`.

### Sample: `GET /api/v1/dashboard/national`

**Description:** Aggregated national metrics (area notified/acquired, compensation paid, families affected, SLA breaches) for the central-ministry dashboard. **Auth required:** Yes · **Minimum role:** CENTRAL (state/district officials get scoped variants at `/dashboard/state/:state` and `/dashboard/district/:district`)

### Error Codes (master reference)

| HTTP | Code | When |
| --- | --- | --- |
| 400 | VALIDATION\_ERROR | Zod validation failed |
| 400 | INVALID\_REQUEST | e.g. disbursed > assessed |
| 401 | TOKEN\_EXPIRED / TOKEN\_INVALID | Access token issues |
| 403 | FORBIDDEN | Wrong role or out-of-scope state/district |
| 404 | NOT\_FOUND | Resource missing or out of requester's scope |
| 409 | CONFLICT | Duplicate survey number in same district |
| 429 | RATE\_LIMIT\_EXCEEDED | Too many requests |
| 500 | INTERNAL\_ERROR | Unhandled — check Sentry |

---

## 12. Backend Security Checklist

- Secrets only in `.env`; `.env*` gitignored; Zod validates env at startup (crash on bad config)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` distinct, ≥64 chars; MongoDB user restricted (not root); Atlas IP allowlist set
- Access token 15 min in `Authorization` header; refresh token 7 days, `HttpOnly; Secure; SameSite=Strict`, hashed in DB, rotated on use, full revocation on reuse
- `crypto.timingSafeEqual()` for all token comparisons; OAuth `state` validated
- `helmet()`, explicit-origin `cors()`, `express-mongo-sanitize()`, `express-rate-limit` (strict on `/auth` and public transparency endpoints), `express.json({limit:'10kb'})`
- `assertOwnership()` / `roleGuard()` in every controller — queries always scoped by `state`/`district`/`agency`; wrong-scope access returns 404, never 403
- Soft-delete pattern on all primary collections
- Compensation and R&R fields double-validated (server-side business rules, not just Zod shape)
- Winston structured logs — no PII, tokens, or bank/compensation account numbers in logs; Sentry scrubbing configured
- `GET /health` (liveness) and `GET /ready` (Mongo connected) excluded from strict rate limits
- `npm audit` clean; `npm ci` in CI; Dependabot/Snyk enabled

---

## 13. Frontend Architecture (Next.js)

- **App Router** with route groups: `(public)` for SSG/ISR transparency pages (no auth, cached), `(dashboard)` for the authenticated SPA-like app shell, `(auth)` for login/OAuth callback.
- **Axios client** (`lib/api/client.ts`) with `withCredentials: true`, single-flight refresh interceptor on `401`/`TOKEN_EXPIRED`, using a separate `refreshClient` with no interceptors to avoid loops.
- **Access token in memory only** (`tokenStore.ts`) — never `localStorage`; refresh token lives in the `HttpOnly` cookie set by the backend.
- **AuthProvider** bootstraps session on load via `POST /auth/refresh` then `GET /users/me`; wraps the dashboard route group.
- **RequireAuth + role guards** on every dashboard route; redirect unauthorized users with the attempted path preserved (`state.from`).
- **TanStack Query** for all server state (proposals, parcels, dashboards); `staleTime` tuned per resource (dashboards refresh more aggressively, e.g. 60s, vs. static reference data).
- **Map module**: Leaflet/Mapbox GL wrapped as a client component (`'use client'`), lazy-loaded to keep the public SSG pages lightweight; parcel GeoJSON fetched via TanStack Query and rendered as layers, colored by status (proposed/notified/acquired/possessed).
- **Tailwind CSS** design tokens aligned to a government-services visual standard (high contrast, accessible color ratios, Devanagari/regional-script font fallback for multilingual labels).
- **Forms**: React Hook Form + Zod for all multi-step proposal/compensation/R&R forms; file uploads validated client-side (type/size) before hitting the server.
- **Error boundary** at root layout; loading/error states on every async view.

---

## 14. Frontend Security Checklist

- Access token memory-only; refresh token HttpOnly cookie; single-flight refresh queue
- `DOMPurify.sanitize()` before any `dangerouslySetInnerHTML` (e.g. remarks/comments fields)
- User-generated content rendered as JSX text, not raw HTML; uploaded-document URLs validated (`http:`/`https:` only)
- OAuth callback route reads token from URL then calls `history.replaceState` to scrub it
- No tokens/PII in `console.log` in production builds
- `NEXT_PUBLIC_*` env vars validated with Zod at build time
- CSP verified against `helmet()` output; no inline scripts without nonce
- `npm audit` clean; `npm ci` in CI

---

## 15. GIS & Geo-Tagging Approach

- Parcels stored as GeoJSON `Polygon`/`MultiPolygon` with a MongoDB `2dsphere` index, enabling `$geoWithin` (district/boundary queries) and `$near` (proximity) operations.
- Field officers capture coordinates via the mobile-responsive web form (GPS from device) or by uploading a shapefile/KML converted server-side to GeoJSON.
- Map layer colors encode parcel `status`; clicking a parcel opens a detail drawer (survey number, owner, compensation, possession status) without a full page reload.
- Public transparency pages show an aggregated, anonymized view (no individual owner PII) to protect landowner privacy while preserving transparency goals.

---

## 16. Notifications & Real-Time Updates

- **socket.io** rooms scoped per `district` and per `proposalId`; JWT-authenticated on connection before any room join.
- Domain events (`PROPOSAL_APPROVED`, `NOTIFICATION_ISSUED`, `AWARD_DECLARED`, `COMPENSATION_DISBURSED`, `POSSESSION_UPDATED`) fan out to: (1) relevant users' in-app `AppNotification` records, (2) email via nodemailer, (3) live socket push to anyone viewing that proposal/parcel.
- **node-cron** jobs: nightly SLA-breach scan (flags proposals past their stage deadline) and reminder dispatch for upcoming deadlines.

---

## 17. Reporting & Dashboards

- Three dashboard scopes: **National** (DoLR/Ministry), **State**, **District** — same widgets, data auto-scoped by requester role.
- Core widgets: area notified vs. acquired, compensation assessed vs. disbursed, families affected/resettled, possession funnel, project timeline adherence (on-track vs. delayed), per-project Gantt-style milestone view.
- MIS reports exportable as CSV/PDF; scheduled report delivery (phase 2) via `node-cron` + `nodemailer`.
- Predictive analytics (phase 2): simple regression/heuristic model flagging proposals at risk of SLA breach based on historical stage-duration data.

---

## 18. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| **Scalability** | Stateless API (horizontally scalable); MongoDB sharding-ready; designed for nationwide, multi-state concurrent use |
| **Security & Compliance** | Encryption at rest & in transit; AES-256-GCM for sensitive third-party tokens; audit log on every state-changing action; aligned with Indian government data-security standards |
| **Interoperability** | Documented REST APIs for land-records/cadastral integration; GeoJSON as the common spatial data format |
| **Availability** | `/health` + `/ready` endpoints for host-level monitoring; target 99.5% uptime in pilot |
| **Accessibility** | WCAG-aligned Tailwind design tokens; multilingual label support (Hindi + regional languages, phase 2) |
| **Data Privacy** | Landowner PII restricted to authorized roles; public pages show aggregated/anonymized data only |

---

## 19. AI Workflow, CI & Git Hygiene

- Never paste real `.env` values, API keys, or OAuth secrets into AI chat tools — use placeholders.
- `.cursorignore` mirrors `.gitignore` (`.env*`, `node_modules`, `.next/`, `dist`, `*.pem`, `*.key`) so secrets never enter AI context.
- Minimal CI on every PR: `npm ci` → lint → `tsc --noEmit` (backend + frontend) → `npm test` → `npm audit --audit-level=high`. Add secret scanning (e.g. `gitleaks`).
- Treat AI-generated diffs as untrusted — review like a junior dev's PR, with extra scrutiny on auth, DB queries, and anything touching compensation/PII data.
- Confirm any AI-suggested npm package name on npmjs.com before installing (guard against typosquatting).

---

## 20. Testing Strategy

**Postman run order (adapt per module):**

```
1. POST /auth/register → create test user per role
2. POST /auth/login → refresh cookie + access token
3. GET  /users/me → verify auth
4. POST /proposals → create proposal (LRB)
5. PATCH /proposals/:id/approve → advance stage (LAA)
6. POST /parcels → geo-tag parcel
7. PATCH /awards/:id/disburse → record compensation
8. PATCH /possession/:id → mark possessed
9. GET  /dashboard/district/:district → verify aggregates reflect above
10. POST /auth/logout → verify session cleared
```

**Per-endpoint minimum coverage:** happy path (200/201), validation error (400), unauthorized (401), expired token (401), forbidden/wrong-role (403), not found / out-of-scope (404), rate-limited (429), conflict/duplicate (409).

**Cross-cutting tests:** role-scoping (a district officer in State A cannot read State B's data), compensation business rule (disbursed ≤ assessed), GIS spatial query correctness (`$geoWithin` returns only parcels inside the queried boundary).

---

## 21. Roadmap / Milestones (Hackathon Timeline)

| Phase | Deliverable |
| --- | --- |
| **Phase 1 — Foundation** | Repo scaffold, auth (email/password + Google OAuth), RBAC, env validation, CI baseline |
| **Phase 2 — Core Workflow** | Proposal submission + multi-stage approval, document repository, audit log |
| **Phase 3 — GIS & Compensation** | Parcel geo-tagging + map visualization, award/compensation tracking, possession status |
| **Phase 4 — R&R + Notifications** | R&R module, automated alerts (email/in-app/socket), SLA cron jobs |
| **Phase 5 — Dashboards & Demo Polish** | National/State/District dashboards, MIS export, public transparency pages, demo data seeding, deployment (Vercel + Render + Atlas) |

---

## 22. Open Questions & Risks

- **Data source for cadastral/land-records API:** which state's existing system (if any) will be used for the integration demo?
- **Authentication for landowners (citizen-facing, phase 2):** Aadhaar-based auth vs. OTP — needs a compliance decision outside MVP scope.
- **Multi-state schema variance:** acquisition stages differ by state; `Proposal.stage` enum and workflow config may need to become state-configurable rather than hardcoded.
- **GIS data quality risk:** field-captured GPS coordinates may have low accuracy in rural areas — consider a manual-correction review step before a parcel is marked `ACQUIRED`.
- **Scale risk:** nationwide rollout implies very high write volume on `AuditLog`/`AppNotification` — plan TTL indexes and archival strategy beyond the hackathon MVP.
