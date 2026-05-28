"use client";

import { useEffect } from "react";
import { useStatsigUser } from "@statsig/react-bindings";

interface StatsigIdentifyProps {
  userId: string;
  email: string;
  fullName?: string;
}

export function StatsigIdentify({
  userId,
  email,
  fullName,
}: StatsigIdentifyProps) {
  const { updateUserAsync } = useStatsigUser();

  useEffect(() => {
    void updateUserAsync({
      userID: userId,
      email,
      custom: fullName ? { fullName } : undefined,
    });
  }, [userId, email, fullName, updateUserAsync]);

  return null;
}
