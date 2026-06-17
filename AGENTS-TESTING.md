# Agent testing guide (Tier 1)

Instructions for Cursor agents verifying Ceptly **as an end user** using the
stub-backend Playwright suite. No real Postgres, Gemini, Slack, or Stripe
required.

## Quick start

```bash
cd ceptly-frontend
npm ci
npx playwright install chromium   # one-time
npm run test:e2e                  # full suite
```

Run a single journey:

```bash
npx playwright test e2e/chat-agent-deploy.spec.ts
npx playwright test e2e/auth.spec.ts --debug   # step through in browser
npx playwright show-report                      # last HTML report + traces
```

## How it works

```
Agent runs Playwright
    → Next.js app on :3000 (production build)
    → Stub backend on :4500 (e2e/mock-server/server.mjs)
    → Session cookies seeded via authedPage fixture
```

The app fetches the API **server-side**, so mocks must live at
`NEXT_PUBLIC_API_URL` — not via browser network interception. See
`playwright.config.ts`.

## Authenticated test user

The `authedPage` fixture (`e2e/fixtures/test.ts`) seeds cookies so middleware
lets you reach protected routes without Stripe:

| Cookie | Value |
| --- | --- |
| `access_token` | `e2e-access-token` |
| `onboarding_complete` | `1` |
| `subscription_active` | `1` |
| `billing_role` | `owner` |

Workspace fixture: `00000000-0000-4000-a000-000000000001` (E2E Workspace).

## Stable selectors (`data-testid`)

Prefer these in specs and when writing new tests:

| Element | `data-testid` |
| --- | --- |
| Chat message input | `chat-message-input` |
| Inline deploy proposal card | `agent-deploy-proposal` |
| Deploy button | `agent-deploy-button` |
| Post-deploy confirmation | `agent-deployed-confirmation` |

Page Object Models live in `e2e/pages/*.page.ts`.

## User journeys

See `e2e/founder-journeys.md` for persona scripts mapped to spec files.

## When to run

- After changing chat, deploy, auth, billing UI, or middleware routing
- Before opening a PR that touches user-facing flows
- When asked to "verify as a user" — run the relevant spec, not manual clicking

## Adding a new journey

1. Add or extend fixtures in `e2e/fixtures/data/` and route handlers in
   `e2e/mock-server/server.mjs`.
2. Add a Page Object in `e2e/pages/` if the flow spans multiple screens.
3. Write `e2e/<journey>.spec.ts` using `authedPage` or plain `page` + cookies.
4. Document the journey in `e2e/founder-journeys.md`.
5. Run `npm run test:e2e` and confirm CI passes.

## Debugging failures

1. Open `playwright-report/` (traces on first retry in CI).
2. Check whether a new API call needs a stub route (catch-all returns `{}` but
   may not match expected DTO shape).
3. Confirm workspace/member IDs are valid UUIDs — server actions validate with Zod.

## What Tier 1 does *not* cover

- Real LLM chat responses (stub SSE in mock server)
- Real Slack/Stripe/Postgres
- Production or staging smoke tests

For those, see the Tier 2/3 notes in the prior architecture discussion.
