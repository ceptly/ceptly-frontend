export interface KnownIntegration {
  id: string;
  name: string;
  description: string;
}

export const KNOWN_INTEGRATIONS: Record<string, KnownIntegration> = {
  slack: {
    id: "slack",
    name: "Slack",
    description:
      "Connect Ceptly to Slack so check-ins run in DMs for your team.",
  },
  linear: {
    id: "linear",
    name: "Linear",
    description:
      "Connect Linear so Ceptly can answer questions about assigned issues alongside check-in data.",
  },
};

export function resolveIntegration(
  integrationId: string,
  fromApi?: KnownIntegration | null,
): KnownIntegration | null {
  return fromApi ?? KNOWN_INTEGRATIONS[integrationId] ?? null;
}
