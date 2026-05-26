"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { setThemeCookieAction } from "@/actions/theme";

export function ThemeCookieSync() {
  const { theme } = useTheme();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (theme !== "light" && theme !== "dark") {
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    void setThemeCookieAction(theme);
  }, [theme]);

  return null;
}
