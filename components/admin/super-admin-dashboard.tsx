"use client";

import { Users, Store, CreditCard, Sparkles, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

type AiUsageStore = {
  storeId: string;
  storeName: string;
  translationCount: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

type AiUsage = {
  translationCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  byStore: AiUsageStore[];
};

type SystemAlert = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
};

type AnthropicAccount = {
  planName: string;
  monthlyLimitUsd: number;
};

type Props = {
  stats: { userCount: number; storeCount: number; activeSubscriptions: number };
  aiUsage: AiUsage;
  anthropicAccount: AnthropicAccount;
  stores: StoreRow[];
  locale: string;
  systemAlerts: SystemAlert[];
};

const STATUS_COLORS: Record<string, string> = {
  TRIALING: "#E86A1A",
  ACTIVE: "#10B981",
  PAST_DUE: "#EF4444",
  CANCELLED: "#6B7280",
  PAUSED: "#8B5CF6",
  NONE: "#6B7280",
};

export function SuperAdminDashboard({ stats, aiUsage, anthropicAccount, stores, locale, systemAlerts }: Props) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SystemAlert[]>(systemAlerts);

  async function dismissAlert(id: string) {
    await fetch(`/api/super-admin/alerts/${id}/read`, { method: "PATCH" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

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

      {alerts.length > 0 && (
        <div className="border-b" style={{ borderColor: "#FCA5A5", background: "#FEF2F2" }}>
          <div className="max-w-6xl mx-auto px-6 py-3 space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold" style={{ color: "#991B1B" }}>{alert.title}: </span>
                  <span className="text-sm" style={{ color: "#B91C1C" }}>{alert.message}</span>
                  <span className="text-xs ml-2" style={{ color: "#DC2626", opacity: 0.6 }}>
                    {new Date(alert.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-red-100 transition-colors"
                  title="Marcar como lido"
                >
                  <X size={14} style={{ color: "#DC2626" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

        {/* AI Usage */}
        <div className="rounded-2xl border mb-8 overflow-hidden" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--cream-dark)" }}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: "var(--orange)" }} />
              <h2 className="font-bold text-text-dark">Uso de IA — mês atual</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              Anthropic · {anthropicAccount.planName}
            </span>
          </div>
          <div className="p-5">
            {/* Account limit bar */}
            {(() => {
              const used = aiUsage.totalCostUsd;
              const limit = anthropicAccount.monthlyLimitUsd;
              const pct = Math.min((used / limit) * 100, 100);
              const remaining = Math.max(limit - used, 0);
              const isWarning = pct >= 70;
              const isDanger = pct >= 90;
              const barColor = isDanger ? "#EF4444" : isWarning ? "#F59E0B" : "#10B981";
              return (
                <div className="rounded-xl border p-4 mb-5" style={{ borderColor: isWarning ? (isDanger ? "#FEE2E2" : "#FEF3C7") : "var(--cream-dark)", background: isDanger ? "#FEF2F2" : isWarning ? "#FFFBEB" : "var(--cream)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Limite mensal da API</span>
                    <span className="text-xs font-mono font-bold" style={{ color: barColor }}>
                      {pct.toFixed(1)}% usado
                    </span>
                  </div>
                  {/* Bar */}
                  <div className="w-full h-3 rounded-full bg-black/8 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-black text-text-dark">${used.toFixed(4)}</p>
                      <p className="text-xs text-text-muted">Usado</p>
                    </div>
                    <div>
                      <p className="text-lg font-black" style={{ color: barColor }}>${remaining.toFixed(4)}</p>
                      <p className="text-xs text-text-muted">Restante</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-text-dark">${limit.toFixed(2)}</p>
                      <p className="text-xs text-text-muted">Limite</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
                <p className="text-2xl font-black text-text-dark">{aiUsage.translationCount}</p>
                <p className="text-xs text-text-muted mt-0.5">Traduções</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
                <p className="text-2xl font-black text-text-dark">
                  {(aiUsage.totalInputTokens + aiUsage.totalOutputTokens).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-text-muted mt-0.5">Tokens totais</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
                <p className="text-2xl font-black text-text-dark">
                  ${aiUsage.totalCostUsd.toFixed(4)}
                </p>
                <p className="text-xs text-text-muted mt-0.5">Custo estimado (USD)</p>
              </div>
            </div>

            {aiUsage.byStore.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--cream-dark)" }}>
                      {["Loja", "Traduções", "Tokens entrada", "Tokens saída", "Custo (USD)"].map((h) => (
                        <th key={h} className="pb-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wide pr-4">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsage.byStore.map((row) => (
                      <tr key={row.storeId} className="border-b" style={{ borderColor: "var(--cream-dark)" }}>
                        <td className="py-2.5 pr-4 font-medium text-text-dark">{row.storeName}</td>
                        <td className="py-2.5 pr-4 text-text-muted">{row.translationCount}</td>
                        <td className="py-2.5 pr-4 text-text-muted">{row.inputTokens.toLocaleString("pt-BR")}</td>
                        <td className="py-2.5 pr-4 text-text-muted">{row.outputTokens.toLocaleString("pt-BR")}</td>
                        <td className="py-2.5 font-mono text-xs text-text-dark">${row.costUsd.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {aiUsage.byStore.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">Nenhuma tradução realizada neste mês.</p>
            )}
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { href: `/${locale}/admin/lojas`, label: "Lojas", desc: "Gerenciar todas as lojas", icon: "🏪" },
            { href: `/${locale}/admin/assinaturas`, label: "Assinaturas", desc: "Financeiro e pagamentos", icon: "💳" },
            { href: `/${locale}/admin/usuarios`, label: "Usuários", desc: "Gestão de contas e roles", icon: "👥" },
          ].map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="rounded-2xl border p-5 hover:shadow-md transition-shadow flex flex-col gap-2"
              style={{ background: "white", borderColor: "var(--cream-dark)" }}
            >
              <span className="text-2xl">{nav.icon}</span>
              <p className="font-bold text-text-dark">{nav.label}</p>
              <p className="text-xs text-text-muted">{nav.desc}</p>
            </Link>
          ))}
        </div>

        {/* Stores table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--cream-dark)" }}>
            <h2 className="font-bold text-text-dark">Lojas recentes</h2>
            <Link href={`/${locale}/admin/lojas`} className="text-xs font-medium text-text-muted hover:text-text-dark px-3 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "var(--cream-dark)" }}>
              Ver todas
            </Link>
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
