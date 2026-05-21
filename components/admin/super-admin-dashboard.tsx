"use client";

import { Users, Store, CreditCard, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type StoreRow = {
  id: string;
  slug: string;
  namePt: string;
  isActive: boolean;
  ownerName: string;
  ownerEmail: string;
  planName: string;
  subscriptionStatus: string;
  orderCount: number;
  createdAt: string;
};

type Props = {
  stats: { userCount: number; storeCount: number; activeSubscriptions: number };
  stores: StoreRow[];
  locale: string;
};

const STATUS_COLORS: Record<string, string> = {
  TRIALING: "#E86A1A",
  ACTIVE: "#10B981",
  PAST_DUE: "#EF4444",
  CANCELLED: "#6B7280",
  PAUSED: "#8B5CF6",
  NONE: "#6B7280",
};

export function SuperAdminDashboard({ stats, stores, locale }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/acesso`);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <header
        className="sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--orange)" }}
          >
            ⚡
          </div>
          <div>
            <p className="text-white font-bold text-sm">Super Admin</p>
            <p className="text-cream/50 text-xs">Visão da plataforma</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/painel`} className="text-cream/60 hover:text-cream text-sm transition-colors">
            Painel
          </Link>
          <button onClick={handleLogout} className="text-cream/50 hover:text-cream text-xs transition-colors">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-text-dark mb-6">Dashboard da Plataforma</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Usuários", value: stats.userCount, icon: <Users size={20} />, color: "#3B82F6" },
            { label: "Lojas", value: stats.storeCount, icon: <Store size={20} />, color: "var(--orange)" },
            { label: "Assinaturas ativas", value: stats.activeSubscriptions, icon: <CreditCard size={20} />, color: "#10B981" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
              <p className="text-3xl font-black text-text-dark">{s.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Stores table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--cream-dark)" }}>
            <h2 className="font-bold text-text-dark">Lojas</h2>
            <div className="flex gap-2">
              <Link href={`/${locale}/admin/usuarios`} className="text-xs font-medium text-text-muted hover:text-text-dark px-3 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "var(--cream-dark)" }}>
                Usuários
              </Link>
              <Link href={`/${locale}/admin/assinaturas`} className="text-xs font-medium text-text-muted hover:text-text-dark px-3 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "var(--cream-dark)" }}>
                Assinaturas
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--cream-dark)" }}>
                  {["Loja", "Dono", "Plano", "Status", "Pedidos", "Criada em"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id} className="border-b hover:bg-cream/50 transition-colors" style={{ borderColor: "var(--cream-dark)" }}>
                    <td className="px-4 py-3">
                      <div>
                        <Link href={`/${locale}/painel/${store.id}`} className="font-semibold text-sm text-text-dark hover:underline">
                          {store.namePt}
                        </Link>
                        <p className="text-xs text-text-muted">{store.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-dark">{store.ownerName}</p>
                      <p className="text-xs text-text-muted">{store.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-dark">{store.planName}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          color: STATUS_COLORS[store.subscriptionStatus],
                          background: `${STATUS_COLORS[store.subscriptionStatus]}15`,
                        }}
                      >
                        {store.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-dark">{store.orderCount}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(store.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
