"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";

export function AccountHeader() {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="cursor-pointer"
            >
              <Image
                src={
                  mounted && (resolvedTheme ?? theme) === "light"
                    ? "/parallax.png"
                    : "/parallax-dark.png"
                }
                alt="Ceptly Logo"
                width={32}
                height={32}
                className="rounded"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
