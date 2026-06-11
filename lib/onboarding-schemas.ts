import { z } from "zod";

export const onboardingRoleSchema = z.enum([
  "founder_executive",
  "team_lead",
  "individual_contributor",
  "other",
]);

export const referralSourceSchema = z.enum([
  "ai_tools",
  "friend_colleague",
  "search_engine",
  "x_twitter",
  "linkedin",
  "other",
]);

export const onboardingToolSchema = z.enum([
  "slack",
  "discord",
  "ms_teams",
  "linear",
  "jira",
  "monday",
  "notion",
]);

export const onboardingCompleteSchema = z
  .object({
    role: onboardingRoleSchema,
    referralSource: referralSourceSchema,
    referralSourceOther: z.string().trim().optional(),
    inviteEmails: z.array(z.string().email()).optional(),
    toolsUsed: z.array(onboardingToolSchema).optional(),
    organizationName: z.string().trim().min(1, "Organization name is required"),
  })
  .superRefine((data, ctx) => {
    if (data.referralSource === "other" && !data.referralSourceOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify how you heard about us",
        path: ["referralSourceOther"],
      });
    }
  });

export type OnboardingRole = z.infer<typeof onboardingRoleSchema>;
export type ReferralSource = z.infer<typeof referralSourceSchema>;
export type OnboardingTool = z.infer<typeof onboardingToolSchema>;
export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteSchema>;

export interface OnboardingFormData {
  role: OnboardingRole | null;
  referralSource: ReferralSource | null;
  referralSourceOther: string;
  inviteEmails: string[];
  toolsUsed: OnboardingTool[];
  organizationName: string;
}

export const ONBOARDING_ROLE_OPTIONS = [
  { value: "founder_executive" as const, label: "Founder / Executive" },
  { value: "team_lead" as const, label: "Team Lead" },
  {
    value: "individual_contributor" as const,
    label: "Individual Contributor",
  },
  { value: "other" as const, label: "Other" },
];

export const REFERRAL_SOURCE_OPTIONS = [
  {
    value: "ai_tools" as const,
    label: "AI Tools",
    description: "Claude, Perplexity, etc.",
  },
  { value: "friend_colleague" as const, label: "Friend / Colleague" },
  { value: "search_engine" as const, label: "Search Engine" },
  { value: "x_twitter" as const, label: "X (Twitter)" },
  { value: "linkedin" as const, label: "LinkedIn" },
  { value: "other" as const, label: "Other" },
];

export const TOOL_OPTIONS = [
  { value: "slack" as const, label: "Slack" },
  { value: "discord" as const, label: "Discord" },
  { value: "ms_teams" as const, label: "MS Teams" },
  { value: "linear" as const, label: "Linear" },
  { value: "monday" as const, label: "monday.com" },
  { value: "notion" as const, label: "Notion" },
];
