import { Crimson_Pro, Crimson_Text } from "next/font/google";

const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`ceptly-auth-page dark flex min-h-screen flex-1 flex-col ${crimsonText.variable} ${crimsonPro.variable}`}
    >
      {children}
    </div>
  );
}
