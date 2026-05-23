import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "E-Coffee — Entrar",
  description: "Entre para gerenciar sua cafeteria",
};

export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
