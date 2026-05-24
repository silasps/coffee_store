"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  DollarSign,
  ArrowLeftRight,
  Settings,
  LogOut,
  ChevronLeft,
  Store,
  Menu,
  X,
  MoreHorizontal,
  Users,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

type Props = {
  children: React.ReactNode;
  storeId: string;
  storeSlug: string;
  storeLocale: string;
  storeName: string;
  locale: string;
  userName: string;
  userRole: string;
};

export function AdminShell({ children, storeId, storeSlug, storeLocale, storeName, locale, userName, userRole }: Props) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push(`/${locale}/acesso`);
      }
    });
    return () => subscription.unsubscribe();
  }, [locale, router]);

  const base = `/${locale}/painel/${storeId}`;
  const label = t as unknown as (key: string) => string;

  const isOwner = userRole === "STORE_OWNER" || userRole === "SUPER_ADMIN";
  const isSeller = userRole === "SELLER";

  // Nav items filtered by role:
  // SELLER        → Dashboard + Pedidos
  // ADMIN         → Dashboard + Produtos + Categorias + Pedidos + Financeiro + Importar
  // OWNER/SUPER   → everything
  const allNav: NavItem[] = [
    { icon: <LayoutDashboard size={20} />, label: label("dashboard"), href: base },
    { icon: <CreditCard size={20} />, label: "Venda", href: `${base}/venda` },
    ...(!isSeller ? [{ icon: <Package size={20} />, label: label("products"), href: `${base}/produtos` }] : []),
    ...(!isSeller ? [{ icon: <Tag size={20} />, label: label("categories"), href: `${base}/categorias` }] : []),
    { icon: <ShoppingBag size={20} />, label: label("orders"), href: `${base}/pedidos` },
    ...(!isSeller ? [{ icon: <DollarSign size={20} />, label: label("finance"), href: `${base}/financeiro` }] : []),
    ...(!isSeller ? [{ icon: <ArrowLeftRight size={20} />, label: label("import"), href: `${base}/importar` }] : []),
    ...(isOwner ? [{ icon: <Settings size={20} />, label: label("settings"), href: `${base}/configuracoes` }] : []),
    ...(isOwner ? [{ icon: <Users size={20} />, label: "Equipe", href: `${base}/equipe` }] : []),
  ];

  // Bottom nav: up to 4 primary + "Mais" button (only when there are secondary items)
  const primaryNav = allNav.slice(0, 4);
  const secondaryNav = allNav.slice(4);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/acesso`);
  }

  function isActive(href: string) {
    return pathname === href || (href !== base && pathname.startsWith(href));
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: "var(--cream)" }}>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="hidden md:block fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`
          hidden md:flex flex-shrink-0 flex-col border-r
          transition-all duration-200 ease-in-out
          ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 w-56" : "relative w-14"}
        `}
        style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
      >
        <div className="flex items-center gap-2 px-3 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--brown-mid)" }}>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-cream/60 hover:text-cream hover:bg-white/10 transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          {sidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Image src="/ecoffee-icon.svg" alt="E-Coffee" width={28} height={28} className="rounded-lg flex-shrink-0" />
              <span className="text-white font-semibold text-sm truncate">{storeName}</span>
            </div>
          )}
        </div>

        {sidebarOpen && isOwner && (
          <Link
            href={`/${locale}/painel`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-cream/50 hover:text-cream text-xs transition-colors border-b"
            style={{ borderColor: "var(--brown-mid)" }}
          >
            <ChevronLeft size={13} />
            {t("stores")}
          </Link>
        )}

        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
          {allNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              title={!sidebarOpen ? item.label : undefined}
              className={`
                flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all
                ${sidebarOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}
                ${isActive(item.href) ? "text-white" : "text-cream/60 hover:text-cream hover:bg-white/10"}
              `}
              style={isActive(item.href) ? { background: "var(--orange)" } : {}}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t flex-shrink-0" style={{ borderColor: "var(--brown-mid)" }}>
          <Link
            href={`/${storeLocale}/${storeSlug}`}
            onClick={() => setSidebarOpen(false)}
            title={!sidebarOpen ? "Ver loja" : undefined}
            className={`flex items-center gap-2.5 rounded-lg text-sm text-cream/60 hover:text-cream hover:bg-white/10 transition-all mb-1 ${sidebarOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
          >
            <Store size={18} className="flex-shrink-0" />
            {sidebarOpen && "Ver loja"}
          </Link>
          <div className={`flex items-center gap-2 mb-1 ${sidebarOpen ? "px-3 py-2" : "px-0 py-2 justify-center"}`}>
            <div className="w-6 h-6 rounded-full bg-cream/20 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && <span className="text-cream/60 text-xs truncate">{userName}</span>}
          </div>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sair" : undefined}
            className={`flex items-center gap-2.5 w-full rounded-lg text-sm text-cream/60 hover:text-red-400 hover:bg-red-400/10 transition-all ${sidebarOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && "Sair"}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t"
        style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
      >
        {primaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${isActive(item.href) ? "text-orange-400" : "text-cream/60"}`}
            style={isActive(item.href) ? { color: "var(--orange)" } : {}}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Mais button — only when there are secondary nav items */}
        {secondaryNav.length > 0 && (
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-cream/60 transition-colors"
          >
            <MoreHorizontal size={20} />
            <span>Mais</span>
          </button>
        )}
      </nav>

      {/* ── MOBILE "MAIS" DRAWER ────────────────────────────────── */}
      {moreOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div
            className="md:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-2xl pb-safe pt-4 px-4"
            style={{ background: "var(--brown-dark)" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            {/* Store name */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <Image src="/ecoffee-icon.svg" alt="E-Coffee" width={28} height={28} className="rounded-lg" />
              <span className="text-white font-semibold text-sm truncate">{storeName}</span>
            </div>

            {/* Secondary nav items */}
            <div className="flex flex-col gap-1 mb-4">
              {secondaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive(item.href) ? "text-white" : "text-cream/70"}`}
                  style={isActive(item.href) ? { background: "var(--orange)" } : {}}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}

              <Link
                href={`/${storeLocale}/${storeSlug}`}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-cream/70 transition-all"
              >
                <Store size={20} />
                <span>Ver loja</span>
              </Link>

              {isOwner && (
                <Link
                  href={`/${locale}/painel`}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-cream/70 transition-all"
                >
                  <ChevronLeft size={20} />
                  <span>{t("stores")}</span>
                </Link>
              )}
            </div>

            {/* User + logout */}
            <div
              className="flex items-center justify-between px-3 py-3 rounded-xl border"
              style={{ borderColor: "var(--brown-mid)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-cream/20 flex items-center justify-center text-xs text-white font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-cream/60 text-sm truncate max-w-[160px]">{userName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-red-400 font-medium"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>

            <div className="h-6" />
          </div>
        </>
      )}
    </div>
  );
}
