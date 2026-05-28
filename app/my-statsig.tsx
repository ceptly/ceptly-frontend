"use client";

import { useMemo } from "react";
import { LogLevel, StatsigProvider } from "@statsig/react-bindings";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";

import { StatsigSessionReplayLoader } from "@/components/statsig-session-replay-loader";

const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;

const ANONYMOUS_USER = { userID: "anonymous" };

function isValidStatsigKey(key: string | undefined): key is string {
  return typeof key === "string" && key.startsWith("client-");
}

export default function MyStatsig({
  children,
}: {
  children: React.ReactNode;
}) {
  const plugins = useMemo(
    () => [
      new StatsigAutoCapturePlugin({
        consoleLogAutoCaptureSettings: {
          enabled: true,
        },
      }),
    ],
    [],
  );

  if (!isValidStatsigKey(sdkKey)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Statsig] NEXT_PUBLIC_STATSIG_CLIENT_KEY is missing or invalid. Analytics disabled.",
      );
    }
    return children;
  }

  return (
    <StatsigProvider
      sdkKey={sdkKey}
      user={ANONYMOUS_USER}
      options={{
        plugins,
        logLevel:
          process.env.NODE_ENV === "development"
            ? LogLevel.Debug
            : LogLevel.Warn,
      }}
    >
      <StatsigSessionReplayLoader />
      {children}
    </StatsigProvider>
  );
}
