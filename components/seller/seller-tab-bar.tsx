"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, ClipboardList } from "lucide-react";

type Props = { storeId: string; locale: string };

const tabs = [
  { label: "Início", icon: Home, href: (s: string, l: string) => `/${l}/vendedor/${s}` },
  { label: "PDV", icon: ShoppingCart, href: (s: string, l: string) => `/${l}/vendedor/${s}/pdv` },
  { label: "Pedidos", icon: ClipboardList, href: (s: string, l: string) => `/${l}/vendedor/${s}/pedidos` },
];

export function SellerTabBar({ storeId, locale }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
      style={{ background: "white", borderColor: "var(--cream-dark)" }}
    >
      {tabs.map(({ label, icon: Icon, href }) => {
        const url = href(storeId, locale);
        const isActive = pathname === url || (label === "Início" ? pathname === url : pathname.startsWith(url));
        return (
          <Link
            key={label}
            href={url}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors"
            style={{ color: isActive ? "var(--orange)" : "var(--text-muted)" }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
