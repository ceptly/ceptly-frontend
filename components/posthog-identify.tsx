"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

interface PostHogIdentifyProps {
  userId: string;
  email: string;
  fullName?: string;
}

export function PostHogIdentify({
  userId,
  email,
  fullName,
}: PostHogIdentifyProps) {
  useEffect(() => {
    posthog.identify(userId, {
      email,
      name: fullName,
    });
  }, [userId, email, fullName]);

  return null;
}
