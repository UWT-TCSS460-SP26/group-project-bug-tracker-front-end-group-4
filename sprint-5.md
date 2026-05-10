# Sprint 5

## User Stories

### As a visitor (your downstream partner), I want to file a bug report against your API without creating an account so that reporting friction is zero.¶

The form is the entire app for an unauth visitor. They land on the URL, fill out the fields, submit, and see a confirmation. Field set should match the request body your POST /issues already accepts — required vs. optional follows the OpenAPI spec.

The route this app calls is the same public POST /issues you stood up in Sprint 3. No JWT, no auth headers — your BE accepts unauthenticated reports by design.

### As a visitor, I want clear feedback when my submission succeeds, fails validation, or fails because the API is down so that I know whether my report actually got through

A real user hits all three states. Success: confirmation message, form clears or redirects. Validation failure: inline errors next to the offending fields, surfaced from the response your API returned. Network or server failure: a non-cryptic message that doesn't suggest the user did something wrong, and that preserves what they typed so they can retry.

### As a teammate, I want to scaffold my own Bug Tracker FE solo with an agentic coding tool against our team's OpenAPI spec so that I get hands-on time with AI-driven scaffolding before the underlying tech is taught

This is your individual work for the sprint. Open Claude Code, Cursor, or your team's tool of choice. Feed it your team's /api-docs spec (or paste the relevant slice). Ask for a Next.js app with a single public form that posts to POST /issues. Iterate — prompt, read what comes back, prompt again to fix or extend. Take the build as far as you reasonably can on your own.

You are not expected to fully understand the code the agent produced this week. React and Next.js are introduced in the Week 7+ readings, lectures, and Check-Off 6. The skill being practiced now is the workflow itself: writing a prompt that gets a useful first cut, recognizing when to redirect the agent, and judging when "good enough" is good enough.

Where your build lives is your call — local-only on your laptop, or in any personal repo of your choosing. There's no GitHub Classroom repo for individual scaffolds. Either way, bring the build (and your workflow writeup) to the team meeting.

### As a teammate, I want to write up my individual AI workflow — what I prompted, what the agent produced, what I kept and cut — so that the team's final repo captures the prompt-and-iterate process as a learning artifact.\

Your writeup is short and concrete. What did your first prompt look like? What did the agent produce on the first cut? What was good, what missed? What was your second prompt — a redirect, an extension, a fix? What did you ultimately keep, what did you throw out, and what would you prompt differently next time?

This is what gets graded for understanding this sprint, not the code. "I prompted X, got Y, kept Z because…" is the explanation form.

Each member's writeup goes into the final team repo (in the README, or in a WORKFLOWS.md linked from the README — your team's call). Your downstream partner doesn't need to read these — but you and your future self do.

### As a frontend developer, I want the form to talk to our deployed API (not localhost) so that the deployed FE actually works end-to-end

Environment variables. Your team picks the variable name (NEXT_PUBLIC_API_URL is the Next.js convention for a value the browser needs to see) and points it at your deployed BE URL in production and your local dev URL in development. No hardcoded URLs in component code. The Deploying Next.js guide walks the env-var setup for both Vercel and Render — the same patterns work whichever host your BE landed on.

CORS lives on the BE side. Your POST /issues route's CORS allowlist needs to accept the deployed FE's origin — that's a config change on your BE repo, not the FE one. Add the FE origin, redeploy the BE, verify the preflight in browser DevTools.
