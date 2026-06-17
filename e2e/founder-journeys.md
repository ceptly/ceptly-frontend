# Founder user journeys (E2E)

Persona scripts for Tier 1 Playwright tests. Each journey runs against the stub
backend — deterministic, CI-safe, no external services.

## Personas

| Persona | Fixture | Spec |
| --- | --- | --- |
| Anonymous visitor | none | `auth.spec.ts` |
| New user (onboarding) | `access_token` only | `onboarding.spec.ts` |
| Workspace owner | `authedPage` | `dashboard.spec.ts`, `billing.spec.ts`, `chat-agent-deploy.spec.ts` |

## Journey: Sign in page smoke

**Persona:** Anonymous visitor  
**Spec:** `e2e/auth.spec.ts`

1. Open `/auth`
2. See sign-in form, Google OAuth link, toggle to sign-up

**Pass criteria:** Welcome copy visible; `/auth/google` link present; sign-up
shows full-name field.

---

## Journey: Onboarding first step

**Persona:** Registered user, onboarding incomplete  
**Spec:** `e2e/onboarding.spec.ts`

1. Seed `access_token` cookie (no `onboarding_complete`)
2. Open `/onboarding`
3. See role-selection step

**Pass criteria:** URL stays on `/onboarding`; founder/executive option visible.

---

## Journey: Dashboard loads

**Persona:** Workspace owner (onboarded, subscribed)  
**Spec:** `e2e/dashboard.spec.ts`

1. Use `authedPage` fixture
2. Open `/dashboard`

**Pass criteria:** URL `/dashboard`; app nav shell visible.

---

## Journey: Billing page loads

**Persona:** Workspace owner  
**Spec:** `e2e/billing.spec.ts`

1. Use `authedPage` fixture
2. Open billing settings

**Pass criteria:** Current plan section renders (fixture-backed).

---

## Journey: Chat → deploy agent (flagship)

**Persona:** Workspace owner  
**Spec:** `e2e/chat-agent-deploy.spec.ts`

1. Use `authedPage` fixture
2. Open `/chat`
3. Type: "Set up a daily standup for my team" → Enter
4. Wait for inline deploy proposal card (`agent-deploy-proposal`)
5. Click **Deploy agent** (`agent-deploy-button`)
6. See confirmation (`agent-deployed-confirmation`)

**Pass criteria:**

- Chat input visible on load
- Deploy button enabled after stream completes
- "Agent deployed" confirmation with link to `/agents`

**Stub behavior:** Mock SSE returns an `agent_form` with a complete standup
config; POST `/agents` returns success.

---

## Journey: Auth page accessibility

**Persona:** Anonymous visitor  
**Spec:** `e2e/a11y.spec.ts`

1. Open `/auth`
2. Run axe scan

**Pass criteria:** No serious or critical a11y violations.
