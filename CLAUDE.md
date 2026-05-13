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

This is a **Next.js 16.2 App Router** front end (TypeScript + Tailwind CSS v4 + Turbopack). It is a single-page app: the entire application is one public form that submits bug reports to the team's backend API.

### Form → API contract

The form on `src/app/page.tsx` is the only route (`/`). It calls `POST /issues` on the backend with this body:

```
{ title: string, body: string, contact: string }  // all required
```

The backend is defined in `openapi.yaml` at the repo root. The relevant endpoint is `POST /issues` (line 1164 of the spec):
- **201** — `{ message, issue }` → form shows success confirmation, clears fields
- **400** — `{ message, details: [{ path, message }] }` → inline field errors mapped by `details[].path` to the matching form field
- **500** — `{ message }` → generic error banner, form input preserved

The `POST /issues` route requires **no authentication** (unlike the admin GET/PATCH/DELETE routes on the same path).

### Environment variables

`NEXT_PUBLIC_API_URL` is the only env var. It's read in `page.tsx` and inlined at build time by Next.js.

| File | Value | Used when |
|---|---|---|
| `.env.development` | `http://localhost:3000` | `npm run dev` |
| `.env.production` | `https://group-project-backend-group-4.onrender.com` | `npm run build` / `npm start` |

No `.env.local` exists — it was intentionally removed to let the environment-specific files take effect. If reintroduced, note that `.env.local` overrides `.env.$(NODE_ENV)` in Next.js's load order.

### File structure

- `src/app/layout.tsx` — Root layout (Geist fonts, metadata)
- `src/app/page.tsx` — The entire app: `'use client'` component with form state machine
- `src/app/globals.css` — Tailwind v4 import + CSS custom properties for light/dark mode

The `page.tsx` component manages four states internally via `useState`:
- `idle` — the form
- `submitting` — form disabled, button shows "Submitting..."
- `success` — green confirmation with "Report another issue" button
- `validation-error` — inline field errors or generic amber banner
- `network-error` — red banner, all input preserved

### Form component conventions

- The form state uses `useState` for `formData`, `status`, `fieldErrors`, and `serverMessage`
- Field errors are indexed by field name (`title`, `body`, `contact`) and clear when the user types in that field
- API errors are surfaced via the `details` array from 400 responses — the `path` string maps directly to the field name
- Network/catch errors preserve all form state so users can retry without re-typing
