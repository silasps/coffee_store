"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store, MessageCircle, Mail, Settings, ExternalLink, Search } from "lucide-react";

type StoreRow = {
  id: string;
  slug: string;
  namePt: string;
  logoUrl: string | null;
  isActive: boolean;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string;
  ownerPhone: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  orderCount: number;
  productCount: number;
  createdAt: string;
};

type Props = { locale: string; stores: StoreRow[] };

const STATUS_COLOR: Record<string, string> = {
  TRIALING: "#E86A1A",
  ACTIVE:   "#10B981",
  PAST_DUE: "#EF4444",
  CANCELLED:"#6B7280",
  PAUSED:   "#8B5CF6",
};

export function AdminStoresClient({ locale, stores }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const filtered = stores.filter(
    (s) =>
      s.namePt.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggle(storeId: string, current: boolean) {
    setToggling(storeId);
    await fetch(`/api/super-admin/stores/${storeId}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setToggling(null);
    router.refresh();
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <header
        className="sticky top-0 z-10 border-b px-6 py-4 flex items-center gap-4"
        style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
      >
        <Link href={`/${locale}/admin`} className="text-cream/60 hover:text-cream transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Store size={16} className="text-orange-400" />
          <p className="text-white font-bold text-sm">Lojas</p>
        </div>
        <span className="text-cream/40 text-xs ml-auto">{filtered.length} loja{filtered.length !== 1 ? "s" : ""}</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, slug ou dono..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          />
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--cream-dark)" }}>
                  {["Loja", "Dono", "Plano", "Pedidos", "Produtos", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((store) => {
                  const subColor = store.subscriptionStatus ? STATUS_COLOR[store.subscriptionStatus] : "#6B7280";
                  return (
                    <tr key={store.id} className="border-b hover:bg-cream/30 transition-colors" style={{ borderColor: "var(--cream-dark)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-text-dark">{store.namePt}</p>
                        <p className="text-xs text-text-muted">{store.slug}</p>
                        <p className="text-xs text-text-muted">
                          Criada {new Date(store.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-dark">{store.ownerName ?? "—"}</p>
                        <p className="text-xs text-text-muted">{store.ownerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        {store.planName ? (
                          <div>
                            <p className="text-sm text-text-dark">{store.planName}</p>
                            {store.subscriptionStatus && (
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ color: subColor, background: `${subColor}15` }}
                              >
                                {store.subscriptionStatus}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">Sem plano</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-text-dark">{store.orderCount}</td>
                      <td className="px-4 py-3 text-sm text-center text-text-dark">{store.productCount}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(store.id, store.isActive)}
                          disabled={toggling === store.id}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
                          style={{
                            color: store.isActive ? "#10B981" : "#EF4444",
                            background: store.isActive ? "#10B98115" : "#EF444415",
                          }}
                        >
                          {store.isActive ? "Ativa" : "Pausada"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/${locale}/painel/${store.id}`}
                            title="Gerenciar loja"
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-cream transition-colors text-text-muted"
                          >
                            <Settings size={14} />
                          </Link>
                          <a
                            href={`/${locale}/${store.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver cardápio"
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-cream transition-colors text-text-muted"
                          >
                            <ExternalLink size={14} />
                          </a>
                          {store.ownerPhone && (
                            <a
                              href={`https://wa.me/${store.ownerPhone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp do dono"
                              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-green-50 transition-colors"
                              style={{ color: "#25D366" }}
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                          <a
                            href={`mailto:${store.ownerEmail}`}
                            title="E-mail do dono"
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-blue-50 transition-colors text-blue-500"
                          >
                            <Mail size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-text-muted py-10">Nenhuma loja encontrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
