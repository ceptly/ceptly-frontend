"use client";

import { useEffect, useRef } from "react";
import { useStatsigClient } from "@statsig/react-bindings";

import {
  AUTH_ANALYTICS_EVENT_COOKIE,
  type AuthAnalyticsEvent,
} from "@/lib/auth/analytics";

const AUTH_EVENTS = new Set<AuthAnalyticsEvent>([
  "sign_in",
  "sign_up",
  "sign_out",
]);

function readAndClearAuthEvent(): AuthAnalyticsEvent | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${AUTH_ANALYTICS_EVENT_COOKIE}=([^;]*)`),
  );

  if (!match) {
    return null;
  }

  document.cookie = `${AUTH_ANALYTICS_EVENT_COOKIE}=; path=/; max-age=0`;

  const event = decodeURIComponent(match[1]) as AuthAnalyticsEvent;
  return AUTH_EVENTS.has(event) ? event : null;
}

export function StatsigAuthTracker() {
  const { client } = useStatsigClient();
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) {
      return;
    }

    const event = readAndClearAuthEvent();
    if (!event) {
      return;
    }

    logged.current = true;
    client.logEvent(event);
  }, [client]);

  return null;
}
