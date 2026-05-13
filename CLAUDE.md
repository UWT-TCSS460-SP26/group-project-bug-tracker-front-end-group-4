# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server (Turbopack). Starts on port 3000 by default. |
| `npm run build` | Production build (`next build` with Turbopack). Compiles TypeScript and generates static output. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |

There is no test suite yet.

## Architecture

Next.js 16.2 App Router frontend (TypeScript + Tailwind CSS v4 + Turbopack). Two regions: a public issue-submission form at `/` and an admin-only triage UI at `/dashboard` and `/issue/[id]`.

The backend API contract is defined in `openapi.yaml` at the repo root. The README lists the deployed and local backend URLs.

### Route layout

| Route | Auth | Component type | Purpose |
|---|---|---|---|
| `/` | None (public) | Client (`"use client"`) | Issue submission form — `POST /issues` |
| `/dashboard` | Admin (next-auth) | Server (async) | Paginated issue list with status filter, sort, pagination |
| `/issue/[id]` | Admin (next-auth) | Server (async) | Issue detail, status change (PATCH), delete (DELETE) |
| `/api/auth/[...nextauth]` | — | Route handler | NextAuth v4 — sign-in/sign-out/callback |

### Authentication (next-auth v4)

Uses **next-auth v4** (stable) with Auth² as a custom OAuth2 provider. The issuer is `https://tcss-460-iam.onrender.com`, audience is `group-4-api`. Auth² uses Authorization Code flow with `client_secret_post` and RS256 signing.

- **Config**: `src/lib/auth-options.ts` — custom OAuth2 provider with `id: "auth2"`, session/JWT callbacks store `accessToken` on the session
- **Route handler**: `src/app/api/auth/[...nextauth]/route.ts` — re-exports `{ GET, POST }` from `NextAuth()`
- **Type augmentation**: `src/lib/next-auth.d.ts` — adds `accessToken` to both `Session` and `JWT` types
- **Session provider**: `src/components/session-provider.tsx` — `"use client"` wrapper so `useSession()` works in client components

The OAuth2 redirect URI Auth² must be configured with is: `{NEXTAUTH_URL}/api/auth/callback/auth2`

### Route protection

`src/proxy.ts` defines which routes are protected (`/dashboard`, `/issue`). The proxy is lightweight — it does NOT verify sessions itself because the Node.js runtime may not have access to the NEXTAUTH_SECRET at the edge.

Actual session verification happens in each protected page's server component via `getServerSession(authOptions)`. Unauthenticated users are redirected to `/api/auth/signin?callbackUrl=...`. This is the **primary trust boundary** — the proxy is secondary.

### Backend API client

`src/lib/api.ts` — all outbound BE calls go through this module. Functions: `listIssues()`, `getIssue()`, `patchIssue()`, `deleteIssue()`. Each function:
1. Calls `getServerSession()` to get the access token
2. Attaches `Authorization: Bearer <token>` header
3. Calls the BE at `NEXT_PUBLIC_API_URL` (from env)
4. Returns a discriminated union `{ ok: true, data }` or `{ ok: false, status, error }`

**Never** call `fetch()` directly against the BE from a component — always go through `src/lib/api.ts` so the auth header is attached.

### Server actions

`src/app/issue/[id]/actions.ts` — `"use server"` functions for mutations:
- `changeStatus(id, status)` — PATCH, revalidates both the issue page and dashboard
- `deleteIssueAction(id)` — DELETE, redirects to `/dashboard` on success

These verify the session before calling the API client.

### Type system

`src/lib/types.ts` — all TypeScript interfaces derived from `openapi.yaml`: `Issue`, `IssueStatus` (enum), `Pagination`, request/response types, query params. The `ISSUE_STATUSES` constant array is used by filter UIs and status dropdowns.

### Public form (existing, untouched)

`src/app/page.tsx` — `'use client'` component with a form state machine (`idle` / `submitting` / `success` / `validation-error` / `network-error`). Calls `POST /issues` (no auth). Field errors map from the API's `details[{ path, message }]` to form fields.

### Environment variables

| Variable | Prefix | Scope | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_` | Client + Server | Backend base URL |
| `OAUTH_CLIENT_ID` | — | Server only | Auth² consumer client ID |
| `OAUTH_CLIENT_SECRET` | — | Server only | Auth² consumer client secret |
| `NEXTAUTH_URL` | — | Server only | **Frontend's** own URL (used by next-auth for OAuth2 callback construction) |
| `NEXTAUTH_SECRET` | — | Server only | NextAuth session encryption key |

**Critical**: `NEXTAUTH_URL` must be the **frontend's** URL, not the backend and not Auth². In dev it's `http://localhost:3001` (or whatever port the FE dev server actually binds to). In production it's the deployed FE URL.

The OAuth credentials (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`) must NEVER have a `NEXT_PUBLIC_` prefix.

## Key constraints

- **No `/me` endpoint exists on the backend.** The FE cannot determine the user's local role via an API call. 403 responses from the BE are surfaced as "Not authorized" UI. The BE's admin middleware is the actual trust boundary.
- **The public form (`/`) must remain auth-free.** Any new auth gating must not affect it.
- **next-auth v4, not v5 beta.** The project intentionally uses v4 for stability. v5 patterns (`auth()`, `handlers`) do not apply.
- **The proxy (`proxy.ts`) is a no-op for auth checks.** It exists to define protection boundaries. Session verification is in server components.
