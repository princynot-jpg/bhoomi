# Bhoomi frontend

A responsive Next.js dashboard for the National Land Acquisition & Management
System. The overview currently uses clearly labeled sample proposal and
dashboard data; proposal, parcel, compensation, and reporting APIs are not
implemented by the backend yet.

## Run locally

1. Start MongoDB and the backend by following `../backend/README.md`.
2. From this directory, run `npm install`.
3. Copy `.env.example` to `.env.local` if the API is not at
   `http://localhost:5000`; set `NEXT_PUBLIC_API_BASE_URL` to its base URL.
4. Run `npm run dev` and open `http://localhost:3000`.

The overview and theme switch can be explored without an API connection.
Sign-in and account creation use the backend's `POST /api/v1/auth/login` and
`POST /api/v1/auth/register` endpoints. The short-lived access token stays in
memory, and credentialed requests accept the HttpOnly refresh cookie. Signed-in
users can sign out from the profile area at the bottom of the dashboard
sidebar. The backend must allow the frontend origin in `CORS_ORIGINS`.

The theme picker includes Sage, Midnight, Ocean, Terracotta and Lavender
palettes. It follows the operating-system light/dark preference initially and
stores an explicit selection in the browser's `bhoomi-theme` local-storage key.
Theme changes, navigation, cards and controls use short transitions; these are
reduced for visitors who prefer reduced motion.

The workspace selector offers Chhattisgarh state, Surguja district, Korba
district, and national demo views. District selections filter the sample
proposal list. Workspace options and overview metrics are illustrative; live
workspace membership and role-scoped data are not connected yet.
Proposal list search, stage filtering, CSV export, responsive navigation, and
the new-proposal preview work with the sample data. Submitting proposals is
not enabled until the corresponding backend route exists.

## Scripts

- `npm run dev` — start the local development server
- `npm run typecheck` — run the strict TypeScript check
- `npm run build` — create the production build
- `npm start` — serve the production build
