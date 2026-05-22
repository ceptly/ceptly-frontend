import Image from "next/image";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex justify-center">
        <Image
          src="/parallax-gradient.png"
          alt="Ceptly Logo"
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
        />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
