"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Mail, ArrowLeft, Search, Users } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  storeCount: number;
  subscriptionStatus: string | null;
  planName: string | null;
  trialUntil: string | null;
  createdAt: string;
};

type Props = { locale: string; users: UserRow[] };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  TRIALING: { label: "Trial", color: "#E86A1A" },
  ACTIVE:   { label: "Ativo", color: "#10B981" },
  PAST_DUE: { label: "Atraso", color: "#EF4444" },
  CANCELLED:{ label: "Cancelado", color: "#6B7280" },
  PAUSED:   { label: "Pausado", color: "#8B5CF6" },
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  STORE_OWNER: "Dono de Loja",
  STORE_ADMIN: "Admin",
  SELLER:      "Vendedor",
};

export function UsersClient({ locale, users }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
  );

  async function handleRoleChange(userId: string, newRole: string) {
    setChangingRole(userId);
    await fetch(`/api/super-admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setChangingRole(null);
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
          <Users size={16} className="text-orange-400" />
          <p className="text-white font-bold text-sm">Usuários</p>
        </div>
        <span className="text-cream/40 text-xs ml-auto">{filtered.length} usuário{filtered.length !== 1 ? "s" : ""}</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          />
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--cream-dark)" }}>
                  {["Usuário", "Contato", "Role", "Plano", "Lojas", "Cadastro", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const status = user.subscriptionStatus ? STATUS_LABEL[user.subscriptionStatus] : null;
                  const trialDays = user.trialUntil
                    ? Math.ceil((new Date(user.trialUntil).getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <tr key={user.id} className="border-b hover:bg-cream/30 transition-colors" style={{ borderColor: "var(--cream-dark)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-text-dark">{user.name ?? "—"}</p>
                        <p className="text-xs text-text-muted">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {user.phone ? (
                          <p className="text-xs text-text-dark font-mono">{user.phone}</p>
                        ) : (
                          <p className="text-xs text-text-muted italic">sem telefone</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          disabled={changingRole === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-xs rounded-lg border px-2 py-1 focus:outline-none disabled:opacity-50"
                          style={{ borderColor: "var(--cream-dark)" }}
                        >
                          {Object.entries(ROLE_LABEL).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {status ? (
                          <div>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: status.color, background: `${status.color}15` }}
                            >
                              {status.label}
                            </span>
                            {user.planName && (
                              <p className="text-xs text-text-muted mt-0.5">{user.planName}</p>
                            )}
                            {user.subscriptionStatus === "TRIALING" && trialDays !== null && (
                              <p className="text-xs mt-0.5" style={{ color: trialDays <= 3 ? "#EF4444" : "var(--text-muted)" }}>
                                {trialDays > 0 ? `${trialDays}d restantes` : "Trial expirado"}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">Sem plano</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-dark text-center">{user.storeCount}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.phone && (
                            <a
                              href={`https://wa.me/${user.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar mensagem WhatsApp"
                              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-green-50"
                              style={{ color: "#25D366" }}
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                          <a
                            href={`mailto:${user.email}`}
                            title="Enviar e-mail"
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-blue-50 text-blue-500"
                          >
                            <Mail size={16} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-text-muted py-10">Nenhum usuário encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
