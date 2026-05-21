"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  BarChart2,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  Store,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  icon: React.ReactNode;
  labelKey: string;
  href: string;
};

type Props = {
  children: React.ReactNode;
  storeId: string;
  storeName: string;
  locale: string;
  userName: string;
};

export function AdminShell({ children, storeId, storeName, locale, userName }: Props) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();

  const base = `/${locale}/painel/${storeId}`;

  const navItems: NavItem[] = [
    { icon: <LayoutDashboard size={18} />, labelKey: "dashboard", href: base },
    { icon: <Package size={18} />, labelKey: "products", href: `${base}/produtos` },
    { icon: <Tag size={18} />, labelKey: "categories", href: `${base}/categorias` },
    { icon: <ShoppingBag size={18} />, labelKey: "orders", href: `${base}/pedidos` },
    { icon: <BarChart2 size={18} />, labelKey: "finance", href: `${base}/financeiro` },
    { icon: <Upload size={18} />, labelKey: "import", href: `${base}/importar` },
    { icon: <Settings size={18} />, labelKey: "settings", href: `${base}/configuracoes` },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/acesso`);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--cream)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--brown-mid)" }}>
          <Link
            href={`/${locale}/painel`}
            className="flex items-center gap-2 text-cream/60 hover:text-cream text-xs mb-3 transition-colors"
          >
            <ChevronLeft size={14} />
            {t("stores")}
          </Link>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "var(--orange)" }}
            >
              {storeName.charAt(0)}
            </div>
            <span className="text-white font-semibold text-sm truncate">{storeName}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== base && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "text-white" : "text-cream/60 hover:text-cream hover:bg-white/10"
                }`}
                style={isActive ? { background: "var(--orange)" } : {}}
              >
                {item.icon}
                {t(item.labelKey as "dashboard" | "products" | "categories" | "orders" | "finance" | "import" | "settings")}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t" style={{ borderColor: "var(--brown-mid)" }}>
          <Link
            href={`/${locale}/${storeId}`}
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-cream/60 hover:text-cream hover:bg-white/10 transition-all mb-1"
          >
            <Store size={18} />
            Ver loja
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-cream/20 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-cream/60 text-xs truncate">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-cream/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={18} />
            {t("users") === "Usuários" ? "Sair" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
