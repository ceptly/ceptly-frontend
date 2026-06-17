import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mocks for server-only / framework boundaries ----------------------------
// Server actions can't execute in jsdom; stub them so the form renders.
vi.mock("@/actions/auth", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/auth/google", () => ({
  getGoogleAuthUrl: () => "https://accounts.google.com/mock",
  resolveGoogleAuthError: () => null,
}));

// useSearchParams returns empty params -> defaults to sign-in mode.
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import AuthPage from "@/app/auth/page";

describe("AuthPage", () => {
  it("renders the sign-in form by default", () => {
    render(<AuthPage />);

    // shadcn CardTitle renders a styled <div>, not a semantic heading, so we
    // assert on text rather than the heading role.
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    // Sign-in has no full-name field.
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it("offers Google sign-in with the resolved OAuth URL", () => {
    render(<AuthPage />);

    const google = screen.getByText(/continue with google/i).closest("a");
    expect(google).toHaveAttribute("href", "https://accounts.google.com/mock");
  });

  it("toggles to the sign-up form and reveals the full-name field", async () => {
    const user = userEvent.setup();
    render(<AuthPage />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      screen.getByText(/create your ceptly account/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });
});
