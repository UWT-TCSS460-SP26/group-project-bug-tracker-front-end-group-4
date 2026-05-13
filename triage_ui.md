# Triage UI

You are to design a UI for a triage system that managues issues, the backend API is already built, and the API specs can be found [here](openapi.yaml).

## Routes

- The index route `/` should remain as is to allow users to create a new issue (no auth required)
- `/dashboard` should be a protected route that requires a user to be authenticated and have the role atleast `admin` and should display a list of all issues and allow the user to filter the issues
- `/issue/:id` should be a protected route that requires a user to be authenticated and have the role atleast `admin` and displays the issue with the given id

## Design

The UI should be modeled after github issues, but with the follow changes:

- Users should not be able to add comments to issues or react to them
- Users should only be able to change the status of an issue
- Users should be presented with a list of issues that they can filter by type or creation date
- After selecting an issue users should be presented with the full issue information including:
  - Issue body
  - Issue status
  - Issue title
  - Contact information
  - Creation Date
- Users should be able to delete issues

## Genreal Shape of work

- Add NextAuth (Auth.js) and configure it against Auth² as an OAuth2 provider — the issuer is <https://tcss-460-iam.onrender.com>,
the audience is your group-N-api name, the client ID/secret come from your group's pre-seeded consumer client in the tcss460-sp26 tenant.

- Give yourself admin on your own BE. Auth² hands every student a User-role token — admin determination is entirely your BE's responsibility.
Promote your own user in your local User table (Prisma Studio is the fastest way: open the row, flip the role column to whatever your team's admin gate checks).
The token from Auth² will keep saying User; your BE's middleware decides who's an admin from the local row.

- Sign in through NextAuth and store the access token on the session; pass it as `Authorization: Bearer <token>` on every outbound call to your BE.

- Call your admin-gated /issues routes — GET /issues for the list, GET /issues/:id for detail, PATCH /issues/:id for status updates, DELETE /issues/:id to clear
out spam or resolved reports. These are the routes you shipped in Sprint 4.

- Hide your triage pages behind a FE route guard. Since the JWT's role claim is always User, the FE has to ask your BE who the caller is — typically by calling a /me (or equivalent)
endpoint that returns the local user row's role. Cache the result on the NextAuth session and gate the route on it. Remember: front-end route guards are a UX convenience,
not a security boundary. Your BE's admin middleware is the actual trust boundary; the FE guard just keeps the routes from rendering for users who'll get a 403 anyway.

- Build the triage UI — list view (sort/filter by status), detail view (full report + repro steps), status dropdown wired to PATCH, delete confirmation wired to DELETE, and a sign-out flow.

- Add a sign-in / sign-out surface — even a single button on a /dashboard route is enough.
