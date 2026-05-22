"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  DollarSign,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  Store,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  const [isOpen, setIsOpen] = useState(false);

  const base = `/${locale}/painel/${storeId}`;

  const navItems: NavItem[] = [
    { icon: <LayoutDashboard size={18} />, labelKey: "dashboard", href: base },
    { icon: <Package size={18} />, labelKey: "products", href: `${base}/produtos` },
    { icon: <Tag size={18} />, labelKey: "categories", href: `${base}/categorias` },
    { icon: <ShoppingBag size={18} />, labelKey: "orders", href: `${base}/pedidos` },
    { icon: <DollarSign size={18} />, labelKey: "finance", href: `${base}/financeiro` },
    { icon: <Upload size={18} />, labelKey: "import", href: `${base}/importar` },
    { icon: <Settings size={18} />, labelKey: "settings", href: `${base}/configuracoes` },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/acesso`);
  }

  function close() {
    setIsOpen(false);
  }

  const label = t as unknown as (key: string) => string;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--cream)" }}>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex-shrink-0 flex flex-col border-r
          transition-all duration-200 ease-in-out
          ${isOpen ? "fixed inset-y-0 left-0 z-50 w-56" : "relative w-14"}
        `}
        style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
      >
        {/* Top: toggle + store */}
        <div className="flex items-center gap-2 px-3 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--brown-mid)" }}>
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-cream/60 hover:text-cream hover:bg-white/10 transition-colors flex-shrink-0"
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {isOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Image
                src="/ecoffee-icon.svg"
                alt="E-Coffee"
                width={28}
                height={28}
                className="rounded-lg flex-shrink-0"
              />
              <span className="text-white font-semibold text-sm truncate">{storeName}</span>
            </div>
          )}
        </div>

        {/* Back to stores — only when open */}
        {isOpen && (
          <Link
            href={`/${locale}/painel`}
            onClick={close}
            className="flex items-center gap-2 px-4 py-2.5 text-cream/50 hover:text-cream text-xs transition-colors border-b"
            style={{ borderColor: "var(--brown-mid)" }}
          >
            <ChevronLeft size={13} />
            {t("stores")}
          </Link>
        )}

        {/* Nav */}
        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== base && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                title={!isOpen ? label(item.labelKey) : undefined}
                className={`
                  flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all
                  ${isOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}
                  ${isActive ? "text-white" : "text-cream/60 hover:text-cream hover:bg-white/10"}
                `}
                style={isActive ? { background: "var(--orange)" } : {}}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isOpen && (
                  <span>{label(item.labelKey)}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t flex-shrink-0" style={{ borderColor: "var(--brown-mid)" }}>
          <Link
            href={`/${locale}/${storeId}`}
            onClick={close}
            title={!isOpen ? "Ver loja" : undefined}
            className={`flex items-center gap-2.5 rounded-lg text-sm text-cream/60 hover:text-cream hover:bg-white/10 transition-all mb-1 ${isOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
          >
            <Store size={18} className="flex-shrink-0" />
            {isOpen && "Ver loja"}
          </Link>

          <div className={`flex items-center gap-2 mb-1 ${isOpen ? "px-3 py-2" : "px-0 py-2 justify-center"}`}>
            <div className="w-6 h-6 rounded-full bg-cream/20 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            {isOpen && <span className="text-cream/60 text-xs truncate">{userName}</span>}
          </div>

          <button
            onClick={handleLogout}
            title={!isOpen ? "Sair" : undefined}
            className={`flex items-center gap-2.5 w-full rounded-lg text-sm text-cream/60 hover:text-red-400 hover:bg-red-400/10 transition-all ${isOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {isOpen && (label("users") === "Usuários" ? "Sair" : "Logout")}
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
