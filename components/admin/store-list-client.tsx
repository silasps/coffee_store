"use client";

import { Plus, Store, Package, ShoppingBag, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type StoreCard = {
  id: string;
  slug: string;
  namePt: string;
  logoUrl: string | null;
  isActive: boolean;
  ownerName: string;
  orderCount: number;
  productCount: number;
  createdAt: string;
};

type Props = {
  stores: StoreCard[];
  locale: string;
  isSuperAdmin: boolean;
  userName: string;
};

export function StoreListClient({ stores, locale, isSuperAdmin, userName }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/acesso`);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--orange)" }}
          >
            ☕
          </div>
          <div>
            <p className="text-white font-bold text-sm">Café AT</p>
            <p className="text-cream/50 text-xs">{isSuperAdmin ? "Super Admin" : "Painel do Dono"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cream/60 text-sm hidden sm:block">{userName}</span>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-cream/50 hover:text-cream transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-dark">
              {isSuperAdmin ? "Todas as Lojas" : "Minhas Lojas"}
            </h1>
            <p className="text-sm text-text-muted">{stores.length} loja{stores.length !== 1 ? "s" : ""}</p>
          </div>
          {!isSuperAdmin && (
            <Link
              href={`/${locale}/painel/nova-loja`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--orange)" }}
            >
              <Plus size={16} />
              Nova Loja
            </Link>
          )}
        </div>

        {stores.length === 0 ? (
          <div
            className="rounded-2xl border p-16 flex flex-col items-center text-center gap-4"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            <Store size={40} className="text-text-muted" />
            <div>
              <p className="font-semibold text-text-dark">Nenhuma loja ainda</p>
              <p className="text-sm text-text-muted mt-1">Crie sua primeira loja para começar</p>
            </div>
            <Link
              href={`/${locale}/painel/nova-loja`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--orange)" }}
            >
              <Plus size={16} />
              Criar loja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <div
                key={store.id}
                className="rounded-2xl border overflow-hidden hover:shadow-md transition-shadow"
                style={{ background: "white", borderColor: "var(--cream-dark)" }}
              >
                {/* Header */}
                <div
                  className="h-20 flex items-center px-5 gap-4"
                  style={{ background: "var(--brown-dark)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{ background: "var(--orange)" }}
                  >
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.namePt} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      store.namePt.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold truncate">{store.namePt}</p>
                    <p className="text-cream/50 text-xs truncate">{store.slug}</p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${store.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                    >
                      {store.isActive ? "Ativa" : "Pausada"}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 divide-x" style={{ borderColor: "var(--cream-dark)" }}>
                  <div className="flex flex-col items-center py-4 gap-1">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <ShoppingBag size={14} />
                      <span className="text-xs">Pedidos</span>
                    </div>
                    <span className="font-bold text-text-dark">{store.orderCount}</span>
                  </div>
                  <div className="flex flex-col items-center py-4 gap-1">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Package size={14} />
                      <span className="text-xs">Produtos</span>
                    </div>
                    <span className="font-bold text-text-dark">{store.productCount}</span>
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-text-muted">Dono: {store.ownerName}</p>
                  </div>
                )}

                {/* Actions */}
                <div
                  className="flex border-t px-4 py-3 gap-2"
                  style={{ borderColor: "var(--cream-dark)" }}
                >
                  <Link
                    href={`/${locale}/painel/${store.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--orange)" }}
                  >
                    <Settings size={14} />
                    Gerenciar
                  </Link>
                  <a
                    href={`/${locale}/${store.slug}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-cream-dark"
                    style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
