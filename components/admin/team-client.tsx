"use client";

import { useState } from "react";
import { Users, UserPlus, Trash2, Copy, Check, X, Link2, ShieldCheck, ShoppingBag, Clock, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@/components/ui/phone-input";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "SELLER";
  createdAt: string;
};

type PendingInvite = {
  id: string;
  token: string;
  role: "ADMIN" | "SELLER";
  expiresAt: string;
};

type Plan = {
  name: string;
  maxAdmins: number;
  maxSellers: number;
};

type Props = {
  storeId: string;
  locale: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  plan: Plan;
  currentUserId: string;
};

function UsageMeter({ label, current, max }: { label: string; current: number; max: number }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min((current / max) * 100, 100);
  const atLimit = !unlimited && current >= max;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="font-semibold" style={{ color: atLimit ? "var(--orange)" : "var(--brown-dark)" }}>
          {unlimited ? `${current} / ∞` : `${current} / ${max}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--cream-dark, #e8ddd3)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: atLimit ? "var(--orange)" : "var(--brown-dark)" }}
          />
        </div>
      )}
      {atLimit && (
        <p className="text-xs font-medium" style={{ color: "var(--orange)" }}>
          Limite atingido — faça upgrade do plano
        </p>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      title="Copiar link"
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
      style={{ color: copied ? "var(--orange)" : "var(--text-muted)", border: "1px solid var(--cream-dark, #e8ddd3)" }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}

export function TeamClient({ storeId, locale, members, pendingInvites, plan, currentUserId }: Props) {
  const router = useRouter();

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "SELLER">("SELLER");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  // Edit modal state
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "SELLER">("SELLER");
  const [savingEdit, setSavingEdit] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  // Shared error / remove state
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const admins = members.filter((m) => m.role === "ADMIN");
  const sellers = members.filter((m) => m.role === "SELLER");
  const adminAtLimit = plan.maxAdmins !== -1 && admins.length >= plan.maxAdmins;
  const sellerAtLimit = plan.maxSellers !== -1 && sellers.length >= plan.maxSellers;
  const selectedRoleAtLimit = inviteRole === "ADMIN" ? adminAtLimit : sellerAtLimit;

  const roleLabel = (r: "ADMIN" | "SELLER") => r === "ADMIN" ? "Administrador" : "Vendedor";

  function daysUntil(iso: string) {
    return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  // ── Invite ────────────────────────────────────────────────────────────────

  async function handleGenerateInvite() {
    setLoadingInvite(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({ role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setGeneratedLink(`${window.location.origin}/${locale}/convite/${data.token}`);
    } finally {
      setLoadingInvite(false);
    }
  }

  function closeInviteModal() {
    setShowInviteModal(false);
    setGeneratedLink(null);
    setError(null);
    setInviteRole("SELLER");
    router.refresh();
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  function openEdit(m: Member) {
    setEditMember(m);
    setEditName(m.name);
    setEditPhone(m.phone);
    setEditRole(m.role);
    setError(null);
    setShowConfirmRemove(false);
  }

  function closeEdit() {
    setEditMember(null);
    setError(null);
    setShowConfirmRemove(false);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editMember || !editName.trim()) { setError("Nome obrigatório."); return; }
    setSavingEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/team/${editMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || null,
          role: editRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      closeEdit();
      router.refresh();
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId);
    try {
      await fetch(`/api/admin/stores/${storeId}/team/${memberId}`, { method: "DELETE" });
      closeEdit();
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  // ── Revoke invite ─────────────────────────────────────────────────────────

  async function handleRevokeInvite(inviteId: string) {
    setRevokingId(inviteId);
    try {
      await fetch(`/api/admin/stores/${storeId}/invites/${inviteId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setRevokingId(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--brown-dark)" }}>
            <Users size={22} />
            Equipe
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Plano <strong>{plan.name}</strong> — limites por loja
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          disabled={adminAtLimit && sellerAtLimit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--orange)" }}
          title={adminAtLimit && sellerAtLimit ? "Limite atingido — faça upgrade" : undefined}
        >
          <UserPlus size={16} />
          Convidar
        </button>
      </div>

      {/* Uso do plano */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ background: "white", borderColor: "var(--cream-dark, #e8ddd3)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--brown-dark)" }}>Uso do plano</h2>
        <UsageMeter label="Administradores" current={admins.length} max={plan.maxAdmins} />
        <UsageMeter label="Vendedores" current={sellers.length} max={plan.maxSellers} />
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Starter: 1 admin · 2 vendedores &nbsp;|&nbsp; Pro: 2 admins · 5 vendedores &nbsp;|&nbsp; Business: ilimitado
        </p>
      </div>

      {/* Membros ativos */}
      {members.length > 0 ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--cream-dark, #e8ddd3)" }}>
          <div className="px-5 py-3 border-b" style={{ background: "var(--cream)", borderColor: "var(--cream-dark, #e8ddd3)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--brown-dark)" }}>
              Membros ativos ({members.length})
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--cream-dark, #e8ddd3)" }}>
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3 bg-white">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "var(--brown-dark)" }}
                >
                  {(m.name || m.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--brown-dark)" }}>{m.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{m.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: m.role === "ADMIN" ? "rgba(232,106,26,0.12)" : "rgba(58,26,0,0.08)",
                      color: m.role === "ADMIN" ? "var(--orange)" : "var(--text-muted)",
                    }}
                  >
                    {m.role === "ADMIN" ? <ShieldCheck size={11} /> : <ShoppingBag size={11} />}
                    {roleLabel(m.role)}
                  </span>
                  <button
                    onClick={() => openEdit(m)}
                    title="Editar membro"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border p-12 flex flex-col items-center text-center gap-3" style={{ background: "white", borderColor: "var(--cream-dark, #e8ddd3)" }}>
          <Users size={36} style={{ color: "var(--text-muted)" }} />
          <p className="font-semibold" style={{ color: "var(--brown-dark)" }}>Nenhum membro ainda</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Convide administradores e vendedores para sua loja.</p>
        </div>
      )}

      {/* Convites pendentes */}
      {pendingInvites.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--cream-dark, #e8ddd3)" }}>
          <div className="px-5 py-3 border-b" style={{ background: "var(--cream)", borderColor: "var(--cream-dark, #e8ddd3)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--brown-dark)" }}>
              Convites pendentes ({pendingInvites.length})
            </h2>
          </div>
          <div className="divide-y bg-white" style={{ borderColor: "var(--cream-dark, #e8ddd3)" }}>
            {pendingInvites.map((inv) => {
              const days = daysUntil(inv.expiresAt);
              const invUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/convite/${inv.token}`;
              return (
                <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                  <Link2 size={16} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: inv.role === "ADMIN" ? "rgba(232,106,26,0.12)" : "rgba(58,26,0,0.08)",
                          color: inv.role === "ADMIN" ? "var(--orange)" : "var(--text-muted)",
                        }}
                      >
                        {roleLabel(inv.role)}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: days <= 1 ? "var(--orange)" : "var(--text-muted)" }}>
                        <Clock size={11} />
                        Expira em {days}d
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 truncate font-mono" style={{ color: "var(--text-muted)" }}>{invUrl}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <CopyButton text={invUrl} />
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      disabled={revokingId === inv.id}
                      title="Revogar convite"
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modal: editar membro ──────────────────────────────────────────── */}
      {editMember && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeEdit} />
          <div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-2xl w-full max-w-sm mx-auto overflow-hidden"
            style={{ background: "white" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--cream-dark, #e8ddd3)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--brown-dark)" }}>Editar membro</h2>
              <button onClick={closeEdit} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {!showConfirmRemove ? (
              <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
                {/* Email — read only */}
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>E-mail</label>
                  <input
                    type="email"
                    value={editMember.email}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl text-sm border cursor-not-allowed"
                    style={{ background: "var(--cream)", borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--text-muted)" }}
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>
                    Nome <span style={{ color: "var(--orange)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 transition-all"
                    style={{ borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--brown-dark)" }}
                  />
                </div>

                {/* Phone */}
                <PhoneInput value={editPhone} onChange={setEditPhone} />

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>Função</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["ADMIN", "SELLER"] as const).map((r) => {
                      const wouldExceedLimit =
                        r !== editMember.role &&
                        (r === "ADMIN" ? adminAtLimit : sellerAtLimit);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => !wouldExceedLimit && setEditRole(r)}
                          disabled={wouldExceedLimit}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            borderColor: editRole === r ? "var(--orange)" : "var(--cream-dark, #e8ddd3)",
                            background: editRole === r ? "rgba(232,106,26,0.06)" : "white",
                            color: editRole === r ? "var(--orange)" : "var(--text-muted)",
                          }}
                        >
                          {r === "ADMIN" ? <ShieldCheck size={14} /> : <ShoppingBag size={14} />}
                          {roleLabel(r)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <p className="text-sm rounded-xl p-3" style={{ background: "rgba(232,106,26,0.1)", color: "var(--orange)" }}>
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {editMember.userId !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmRemove(true)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      Remover
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingEdit || !editName.trim()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: "var(--orange)" }}
                  >
                    {savingEdit ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            ) : (
              /* Confirmação de remoção */
              <div className="p-5 space-y-4">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Tem certeza que deseja remover <strong style={{ color: "var(--brown-dark)" }}>{editMember.name}</strong> da equipe?
                  O acesso será revogado imediatamente.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirmRemove(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-gray-50"
                    style={{ borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--text-muted)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleRemoveMember(editMember.id)}
                    disabled={removingId === editMember.id}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
                  >
                    {removingId === editMember.id ? "Removendo..." : "Confirmar remoção"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal: convidar membro ────────────────────────────────────────── */}
      {showInviteModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeInviteModal} />
          <div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-2xl p-6 max-w-sm mx-auto space-y-5"
            style={{ background: "white" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: "var(--brown-dark)" }}>Convidar membro</h2>
              <button onClick={closeInviteModal} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {!generatedLink ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: "var(--brown-dark)" }}>Função do membro</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["ADMIN", "SELLER"] as const).map((r) => {
                      const atLimit = r === "ADMIN" ? adminAtLimit : sellerAtLimit;
                      return (
                        <button
                          key={r}
                          onClick={() => !atLimit && setInviteRole(r)}
                          disabled={atLimit}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            borderColor: inviteRole === r ? "var(--orange)" : "var(--cream-dark, #e8ddd3)",
                            background: inviteRole === r ? "rgba(232,106,26,0.06)" : "white",
                            color: inviteRole === r ? "var(--orange)" : "var(--text-muted)",
                          }}
                        >
                          {r === "ADMIN" ? <ShieldCheck size={18} /> : <ShoppingBag size={18} />}
                          {roleLabel(r)}
                          {atLimit && <span className="text-[10px]">Limite atingido</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <p className="text-sm rounded-xl p-3" style={{ background: "rgba(232,106,26,0.1)", color: "var(--orange)" }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleGenerateInvite}
                  disabled={loadingInvite || selectedRoleAtLimit}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: "var(--orange)" }}
                >
                  {loadingInvite ? "Gerando..." : "Gerar link de convite"}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Compartilhe com o novo <strong>{roleLabel(inviteRole).toLowerCase()}</strong>. Válido por 7 dias.
                </p>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl border text-xs font-mono break-all"
                  style={{ background: "var(--cream)", borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--brown-dark)" }}
                >
                  <span className="flex-1">{generatedLink}</span>
                  <CopyButton text={generatedLink} />
                </div>
                <button
                  onClick={closeInviteModal}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--text-muted)" }}
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
