# Testing — ceptly-frontend

Two layers:

| Layer | Tool | Scope |
| --- | --- | --- |
| **Unit + component** | Vitest + React Testing Library (jsdom) | Pure helpers (`lib/chat-agent-form`, `lib/subscription-tiers`) and **client** components (`app/auth/page.tsx`). Async Server Components are not unit-testable — they're covered by E2E. |
| **E2E** | Playwright | Critical journeys against the real Next app pointed at a **stub backend** (`e2e/mock-server`). |

## Install

```bash
npm ci
npx playwright install chromium   # one-time, for E2E
```

## Run

```bash
npm test            # unit + component (Vitest)
npm run test:watch  # watch mode
npm run coverage    # v8 coverage

npm run test:e2e    # Playwright (auto-starts stub backend + builds/serves app)
npm run test:e2e:ui # Playwright UI mode (great for debugging)
```

## Why a stub backend (not browser route mocks)

The app fetches the backend **server-side** (server components, server actions,
proxy route handlers) via `NEXT_PUBLIC_API_URL`. Playwright's `page.route` only
sees the *browser's* network, so it can't intercept those. Instead,
`playwright.config.ts` starts `e2e/mock-server/server.mjs` and points the app's
API URLs at it — every backend call is mocked at the network boundary, SSR
included. Billing enforcement is disabled in the test env so authed routes are
reachable with a session cookie (see `e2e/fixtures/test.ts`).

```
e2e/
  mock-server/server.mjs   stub backend (fixtures + permissive catch-all)
  fixtures/
    test.ts                `authedPage` fixture (seeds session cookies)
    data/*.json            response fixtures (dashboard, billing, personas, user, workspace)
  pages/*.page.ts          Page Object Models
  *.spec.ts                auth, dashboard, billing, onboarding, a11y, chat-agent-deploy
```

## Status of specs

- `auth.spec`, `a11y.spec` — client-rendered, backend-independent; most stable.
- `dashboard.spec`, `billing.spec`, `onboarding.spec` — render against fixtures;
  assert routing + app shell. Add data-level assertions once fixtures are
  confirmed against the live DTOs.
- `chat-agent-deploy.spec` — the flagship chat → inline `agent_form` → deploy
  flow. The stub backend replays the chat SSE protocol (`streamAgentForm` in
  `e2e/mock-server/server.mjs`). Uses stable `data-testid`s on the chat input,
  deploy card, deploy button, and confirmation. See `e2e/founder-journeys.md`.

Pure streaming logic (SSE parsing, message normalization, activity reducer,
tool labels) is covered by the fast `test/unit/workspace-chat-stream.test.ts`
unit suite — no browser needed.

## Debugging

```bash
npx playwright test auth.spec.ts --debug   # step through
npx playwright show-report                  # open last HTML report (traces on failure)
npx vitest run test/component/auth-page.test.tsx
```

## CI

`.github/workflows/ci.yml` runs lint + typecheck + Vitest in one job and
Playwright (with `npx playwright install --with-deps chromium`) in another,
uploading the HTML report as an artifact.

## Agent testing

Cursor agents should follow `AGENTS-TESTING.md` and the journey scripts in
`e2e/founder-journeys.md` when asked to verify user flows.
