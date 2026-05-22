"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, MessageCircle, Mail, TrendingUp, AlertTriangle } from "lucide-react";

type SubscriptionRow = {
  id: string;
  status: string;
  planName: string;
  planPrice: number;
  trialUntil: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  userName: string | null;
  userEmail: string;
  userPhone: string | null;
  userId: string;
  createdAt: string;
};

type Plan = { id: string; name: string; priceMonthly: number };
type Counts = { active: number; trialing: number; pastDue: number; cancelled: number; paused: number };

type Props = {
  locale: string;
  mrr: number;
  counts: Counts;
  plans: Plan[];
  subscriptions: SubscriptionRow[];
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  TRIALING:  { label: "Trial", color: "#E86A1A" },
  ACTIVE:    { label: "Ativo", color: "#10B981" },
  PAST_DUE:  { label: "Atraso", color: "#EF4444" },
  CANCELLED: { label: "Cancelado", color: "#6B7280" },
  PAUSED:    { label: "Pausado", color: "#8B5CF6" },
};

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "TRIALING", label: "Trial" },
  { value: "PAST_DUE", label: "Em atraso" },
  { value: "CANCELLED", label: "Cancelados" },
];

export function SubscriptionsClient({ locale, mrr, counts, plans, subscriptions }: Props) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? subscriptions : subscriptions.filter((s) => s.status === filter);

  const trialExpiringSoon = subscriptions.filter((s) => {
    if (s.status !== "TRIALING" || !s.trialUntil) return false;
    const days = Math.ceil((new Date(s.trialUntil).getTime() - Date.now()) / 86400000);
    return days <= 5;
  });

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
          <CreditCard size={16} className="text-orange-400" />
          <p className="text-white font-bold text-sm">Assinaturas</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Financial summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="rounded-2xl border p-5 col-span-2 sm:col-span-1" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} style={{ color: "#10B981" }} />
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">MRR</p>
            </div>
            <p className="text-3xl font-black text-text-dark">
              {mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-xs text-text-muted mt-0.5">por mês (ativos)</p>
          </div>

          {[
            { label: "Ativos", value: counts.active, color: "#10B981" },
            { label: "Trial", value: counts.trialing, color: "#E86A1A" },
            { label: "Em atraso", value: counts.pastDue, color: "#EF4444" },
            { label: "Cancelados", value: counts.cancelled, color: "#6B7280" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{stat.label}</p>
              <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Plans breakdown */}
        <div className="rounded-2xl border mb-6 p-5" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          <p className="text-sm font-bold text-text-dark mb-3">Distribuição por plano</p>
          <div className="flex flex-wrap gap-3">
            {plans.map((plan) => {
              const count = subscriptions.filter((s) => s.planName === plan.name && s.status === "ACTIVE").length;
              const revenue = count * plan.priceMonthly;
              return (
                <div key={plan.id} className="rounded-xl px-4 py-3 flex-1 min-w-[120px]" style={{ background: "var(--cream)" }}>
                  <p className="font-semibold text-sm text-text-dark">{plan.name}</p>
                  <p className="text-xs text-text-muted">{count} ativo{count !== 1 ? "s" : ""}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: "var(--orange)" }}>
                    {revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expiring trials alert */}
        {trialExpiringSoon.length > 0 && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-orange-800">
                {trialExpiringSoon.length} trial{trialExpiringSoon.length !== 1 ? "s" : ""} expirando em breve
              </p>
              <p className="text-xs text-orange-700 mt-0.5">
                {trialExpiringSoon.map((s) => s.userName ?? s.userEmail).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f.value ? "text-white" : "text-text-muted hover:text-text-dark border"}`}
              style={filter === f.value ? { background: "var(--brown-dark)" } : { borderColor: "var(--cream-dark)" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Subscriptions table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--cream-dark)" }}>
                  {["Usuário", "Plano", "Status", "Vencimento", "Cadastro", "Contato"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => {
                  const status = STATUS_LABEL[sub.status];
                  const trialDays = sub.trialUntil
                    ? Math.ceil((new Date(sub.trialUntil).getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <tr key={sub.id} className="border-b hover:bg-cream/30 transition-colors" style={{ borderColor: "var(--cream-dark)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-text-dark">{sub.userName ?? "—"}</p>
                        <p className="text-xs text-text-muted">{sub.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-dark">{sub.planName}</p>
                        <p className="text-xs text-text-muted">
                          {sub.planPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: status.color, background: `${status.color}15` }}
                        >
                          {status.label}
                        </span>
                        {sub.status === "TRIALING" && trialDays !== null && (
                          <p className="text-xs mt-0.5" style={{ color: trialDays <= 3 ? "#EF4444" : "var(--text-muted)" }}>
                            {trialDays > 0 ? `${trialDays}d restantes` : "Expirado"}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")
                          : sub.trialUntil
                            ? new Date(sub.trialUntil).toLocaleDateString("pt-BR")
                            : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {sub.userPhone && (
                            <a
                              href={`https://wa.me/${sub.userPhone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp"
                              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-green-50 transition-colors"
                              style={{ color: "#25D366" }}
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}
                          <a
                            href={`mailto:${sub.userEmail}`}
                            title="E-mail"
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-blue-50 transition-colors text-blue-500"
                          >
                            <Mail size={15} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-text-muted py-10">Nenhuma assinatura encontrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
