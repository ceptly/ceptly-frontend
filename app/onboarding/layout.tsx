import Image from "next/image";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ceptly-auth-shell">
      <div className="ceptly-auth-bg" aria-hidden>
        <div className="ceptly-auth-bg ceptly-auth-grid absolute inset-0" />
        <div className="ceptly-auth-bg ceptly-auth-dots absolute inset-0" />
      </div>
      <div className="relative z-[2] flex w-full max-w-[480px] flex-col gap-6">
        <div className="flex justify-center">
          <Image
            src="/parallax-gradient.png"
            alt="Ceptly"
            width={46}
            height={46}
            className="size-[46px] object-contain"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
