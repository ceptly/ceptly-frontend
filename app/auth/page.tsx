"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Lock, Mail, User } from "lucide-react";

import { signIn, signUp } from "@/actions/auth";
import { getGoogleAuthUrl, resolveGoogleAuthError } from "@/lib/auth/google";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? undefined;
  const initialMode =
    searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
  const prefilledEmail = searchParams.get("email") ?? "";
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const googleAuthError = resolveGoogleAuthError(searchParams.get("error"));

  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [signInState, signInAction] = useActionState(signIn, undefined);
  const [signUpState, signUpAction] = useActionState(signUp, undefined);

  useEffect(() => {
    if (searchParams.get("mode") === "sign-up") {
      setMode("sign-up");
    }
    if (searchParams.get("checkout") === "success") {
      setMode("sign-up");
    }
  }, [searchParams]);

  const isSignUp = mode === "sign-up";
  const formState = isSignUp ? signUpState : signInState;
  const googleAuthUrl = getGoogleAuthUrl(
    inviteToken ? { inviteToken } : undefined,
  );

  return (
    <div className="ceptly-auth-shell">
      <div className="ceptly-auth-bg" aria-hidden>
        <div className="ceptly-auth-bg ceptly-auth-grid absolute inset-0" />
        <div className="ceptly-auth-bg ceptly-auth-dots absolute inset-0" />
        <div className="ceptly-auth-watermark">
          <Image
            src="/parallax-light.png"
            alt=""
            width={460}
            height={460}
            className="h-auto w-full dark:hidden"
          />
          <Image
            src="/parallax-dark.png"
            alt=""
            width={460}
            height={460}
            className="hidden h-auto w-full dark:block"
          />
        </div>
      </div>

      <div className="relative z-[2] flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex justify-center">
          <Image
            src="/parallax-gradient.png"
            alt="Ceptly"
            width={46}
            height={46}
            className="size-[46px] object-contain"
          />
        </div>

        <Card className="ceptly-auth-card">
          <CardHeader className="ceptly-auth-head">
            <CardTitle className="text-[23px] leading-[1.4] tracking-[-0.2px] text-[#fafafa]">
              {isSignUp ? "Create your Ceptly account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {inviteToken
                ? isSignUp
                  ? "Create an account to accept your workspace invite"
                  : "Sign in to accept your workspace invite"
                : isSignUp
                  ? "Sign up with your email and password"
                  : "Sign in to your Ceptly account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="ceptly-auth-body">
            {checkoutSuccess && isSignUp ? (
              <Alert>
                <AlertDescription>
                  Payment successful. Create your account with the same email
                  you used in Stripe to unlock your workspace.
                </AlertDescription>
              </Alert>
            ) : null}

            {googleAuthError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{googleAuthError}</AlertDescription>
              </Alert>
            ) : null}

            {formState?.errors?._form && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.errors._form[0]}</AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              className="w-full"
              nativeButton={false}
              render={<a href={googleAuthUrl} />}
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="ceptly-auth-or">
              <span>or</span>
            </div>

            {isSignUp ? (
              <form action={signUpAction} className="space-y-4">
                {inviteToken ? (
                  <input type="hidden" name="inviteToken" value={inviteToken} />
                ) : null}
                <div className="space-y-0">
                  <Label
                    htmlFor="email"
                    className="mb-[7px] block text-[13px] font-semibold"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      defaultValue={prefilledEmail}
                      required
                    />
                  </div>
                  {signUpState?.errors?.email && (
                    <p className="mt-1.5 text-sm text-destructive">
                      {signUpState.errors.email[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-0">
                  <Label
                    htmlFor="fullName"
                    className="mb-[7px] block text-[13px] font-semibold"
                  >
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Jordan Avery"
                      className="pl-10"
                      required
                    />
                  </div>
                  {signUpState?.errors?.fullName && (
                    <p className="mt-1.5 text-sm text-destructive">
                      {signUpState.errors.fullName[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-0">
                  <Label
                    htmlFor="password"
                    className="mb-[7px] block text-[13px] font-semibold"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                  {signUpState?.errors?.password && (
                    <p className="mt-1.5 text-sm text-destructive">
                      {signUpState.errors.password[0]}
                    </p>
                  )}
                  <p className="mt-[7px] text-xs text-muted-foreground">
                    Must be at least 8 characters with a letter and a number
                  </p>
                </div>

                <SubmitButton
                  label="Create account"
                  pendingLabel="Creating account..."
                />
              </form>
            ) : (
              <form action={signInAction} className="space-y-4">
                {inviteToken ? (
                  <input type="hidden" name="inviteToken" value={inviteToken} />
                ) : null}
                <div className="space-y-0">
                  <Label
                    htmlFor="signin-email"
                    className="mb-[7px] block text-[13px] font-semibold"
                  >
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="you@acme.com"
                    defaultValue={prefilledEmail}
                    required
                  />
                  {signInState?.errors?.email && (
                    <p className="mt-1.5 text-sm text-destructive">
                      {signInState.errors.email[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-0">
                  <Label
                    htmlFor="signin-password"
                    className="mb-[7px] block text-[13px] font-semibold"
                  >
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                  {signInState?.errors?.password && (
                    <p className="mt-1.5 text-sm text-destructive">
                      {signInState.errors.password[0]}
                    </p>
                  )}
                </div>

                <SubmitButton label="Sign in" pendingLabel="Signing in..." />
              </form>
            )}
          </CardContent>

          <div className="ceptly-auth-foot">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setMode(isSignUp ? "sign-in" : "sign-up")}
            >
              {isSignUp ? "Sign in" : "Create account"}
            </button>
          </div>

          <p className="ceptly-auth-fine">
            By continuing, you agree to our terms of service and privacy
            policy.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
