import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AcceptInviteClient } from "@/components/admin/accept-invite-client";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function ConvitePage({ params }: Props) {
  const { locale, token } = await params;

  const invite = await db.storeInvite.findUnique({
    where: { token },
    include: { store: { select: { namePt: true } } },
  });

  if (!invite) {
    return <InviteError title="Convite inválido" message="Este link de convite não existe." />;
  }

  if (invite.usedAt) {
    return <InviteError title="Convite já utilizado" message="Este convite já foi aceito por outro usuário." />;
  }

  if (invite.expiresAt < new Date()) {
    return <InviteError title="Convite expirado" message="Este link expirou. Solicite um novo convite ao responsável da loja." />;
  }

  const { user } = await getUser();

  if (user) {
    const isOwner = await db.store.findFirst({
      where: { id: invite.storeId, ownerId: user.id },
      select: { id: true },
    });
    if (isOwner) {
      return <InviteError title="Você já é o responsável desta loja" message="O dono da loja não precisa de convite para acessá-la." />;
    }
  }

  const roleLabel = invite.role === "ADMIN" ? "Administrador" : "Vendedor";

  return (
    <AcceptInviteClient
      token={token}
      locale={locale}
      storeName={invite.store.namePt}
      roleLabel={roleLabel}
      loggedInUser={user ? { name: user.name ?? "", phone: user.phone ?? "", email: user.email } : null}
    />
  );
}

function InviteError({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--cream)" }}>
      <div
        className="rounded-2xl border p-8 max-w-sm w-full text-center space-y-3"
        style={{ background: "white", borderColor: "var(--cream-dark, #e8ddd3)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl"
          style={{ background: "rgba(232,106,26,0.12)", color: "var(--orange)" }}
        >
          ✗
        </div>
        <h1 className="text-lg font-bold" style={{ color: "var(--brown-dark)" }}>{title}</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
      </div>
    </div>
  );
}
