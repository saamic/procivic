import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Procivic — Your ballot, decoded",
  description:
    "A personalized, evidence-backed read on every item of your ballot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
