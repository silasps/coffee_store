import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Cafe AT",
  description: "De Tamandare para as nacoes",
};

export default function RootRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
