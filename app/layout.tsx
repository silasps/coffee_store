import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Café AT",
  description: "De Tamandaré para as nações",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
