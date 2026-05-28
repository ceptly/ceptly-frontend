"use client";

import { useEffect } from "react";
import { useStatsigClient } from "@statsig/react-bindings";

export function StatsigSessionReplayLoader() {
  const { client } = useStatsigClient();

  useEffect(() => {
    let cancelled = false;

    const start = () => {
      void import("@statsig/session-replay").then(
        ({ runStatsigSessionReplay }) => {
          if (!cancelled) {
            runStatsigSessionReplay(client);
          }
        },
      );
    };

    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(start);
    } else {
      timeoutHandle = setTimeout(start, 2000);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) {
        window.cancelIdleCallback?.(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [client]);

  return null;
}
