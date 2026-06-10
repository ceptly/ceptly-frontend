<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into Ceptly's Next.js App Router application. Client-side analytics are initialized via `instrumentation-client.ts` (the Next.js 15.3+ standard), with a `/ingest` reverse proxy configured in `next.config.ts` to improve reliability. Users are identified client-side via a `PostHogIdentify` component rendered in the root layout whenever a user is authenticated, and server-side at the moment of login/signup via `posthog-node`. Thirteen business-critical events are tracked across server actions and API routes.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User created a new account with email and password | `actions/auth.ts` |
| `user_signed_in` | User signed in with email and password | `actions/auth.ts` |
| `user_signed_in_with_google` | User authenticated via Google OAuth callback | `app/auth/google/callback/route.ts` |
| `onboarding_completed` | User completed the onboarding wizard | `actions/onboarding.ts` |
| `billing_checkout_started` | User initiated a billing checkout session | `actions/billing.ts` |
| `billing_portal_opened` | User opened the Stripe billing portal | `actions/billing.ts` |
| `subscription_seats_updated` | Workspace subscription seat count was updated | `actions/billing.ts` |
| `agent_deployed` | A new agent (checkin, reachout, or standup) was deployed | `actions/agents.ts` |
| `agent_updated` | An existing agent was edited and saved | `actions/agents.ts` |
| `conversation_published` | A conversation was created from a template and published | `actions/create-conversation.ts` |
| `team_member_invited` | A workspace admin sent an invite to a team member | `actions/invites.ts` |
| `invite_accepted` | A user accepted a workspace invite | `actions/invites.ts` |
| `chat_message_sent` | User sent a message in the workspace chat | `app/api/workspaces/[workspaceId]/chat/stream/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/463308/dashboard/1691702)
- [New signups](https://us.posthog.com/project/463308/insights/gvFTprYy) — Daily email vs Google signups over 30 days
- [Activation funnel](https://us.posthog.com/project/463308/insights/fZKAmVCy) — Conversion from signup → onboarding → billing checkout
- [Agent deployments](https://us.posthog.com/project/463308/insights/HCCbPFOX) — Daily agent deploys over 30 days
- [Daily active chat users](https://us.posthog.com/project/463308/insights/io2uVmT2) — Unique users chatting per day over 30 days
- [Team invites sent vs accepted](https://us.posthog.com/project/463308/insights/jbcyzgiO) — Weekly invite funnel over 90 days

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
