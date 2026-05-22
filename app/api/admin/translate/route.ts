import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sendDeveloperAlert } from "@/lib/mailer";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_NAMES: Record<string, string> = {
  pt: "Portuguese (Brazil)",
  en: "English",
  es: "Spanish",
};

const CULTURE_NOTES: Record<string, string> = {
  en: "Use vocabulary and expressions common in North American or UK coffee culture (e.g., 'artisan', 'single-origin', 'velvety'). Avoid literal translations — write as if a native barista wrote it.",
  es: "Use expressions common in Latin American or Spanish café culture. Opt for warm, inviting language. Avoid literal translations — write as a native speaker would describe menu items.",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { authId: user.id },
    select: { role: true, subscription: { select: { status: true } } },
  });

  const isSuperAdmin = dbUser?.role === "SUPER_ADMIN";
  const isPaid = dbUser?.subscription?.status === "ACTIVE";

  if (!isSuperAdmin && !isPaid) {
    return NextResponse.json({ error: "Recurso disponível apenas em planos pagos." }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada no servidor." }, { status: 500 });
  }

  const { sourceLang, targetLang, fields, storeId } = await req.json();

  if (!sourceLang || !targetLang || !fields) {
    return NextResponse.json({ error: "sourceLang, targetLang e fields são obrigatórios." }, { status: 400 });
  }

  if (!LANG_NAMES[sourceLang] || !LANG_NAMES[targetLang]) {
    return NextResponse.json({ error: "Idioma não suportado. Use: pt, en, es." }, { status: 400 });
  }

  const sourceLabel = LANG_NAMES[sourceLang];
  const targetLabel = LANG_NAMES[targetLang];
  const cultureNote = CULTURE_NOTES[targetLang] ?? "";

  const fieldLines = [
    fields.name ? `Name: ${fields.name}` : null,
    fields.description ? `Description: ${fields.description}` : null,
    fields.highlight ? `Highlight: ${fields.highlight}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (!fieldLines) {
    return NextResponse.json({ name: null, description: null, highlight: null });
  }

  let message;
  try {
    message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: `You are a professional copywriter for specialty coffee shops and food & beverage brands.
Your task: translate product menu content from ${sourceLabel} to ${targetLabel}.

Rules:
- DO NOT translate literally. Adapt culturally so it sounds natural to native speakers.
- Keep the tone warm, inviting, and evocative — the kind of language that makes people want to order the item.
- Preserve sensory details (texture, taste, aroma) but rephrase them naturally.
- Match the register: if the source is casual, be casual; if formal, be formal.
- If a field is empty or not provided, return null for that field.
${cultureNote ? `\nCulture tip: ${cultureNote}` : ""}

Respond ONLY with a valid JSON object using exactly these keys: "name", "description", "highlight".
Do not include any explanation, markdown, or extra text — only the JSON object.`,
    messages: [
      {
        role: "user",
        content: `Translate the following product fields from ${sourceLabel} to ${targetLabel}:\n\n${fieldLines}`,
      },
    ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("credit balance") || msg.includes("billing")) {
      const alertTitle = "Saldo Anthropic insuficiente";
      const alertMsg = "A API da Anthropic retornou erro de saldo insuficiente. As funcionalidades de IA estão indisponíveis. Acesse console.anthropic.com → Plans & Billing para adicionar créditos.";
      await Promise.allSettled([
        db.systemAlert.create({ data: { type: "ANTHROPIC_BILLING", title: alertTitle, message: alertMsg } }),
        sendDeveloperAlert(
          `⚠️ ${alertTitle} — Café AT`,
          `<p><strong>${alertTitle}</strong></p><p>${alertMsg}</p><p>Horário: ${new Date().toLocaleString("pt-BR")}</p>`
        ),
      ]);
      return NextResponse.json({ error: "Serviço de IA indisponível. Entre em contato com o desenvolvedor." }, { status: 503 });
    }
    return NextResponse.json({ error: "Erro ao contatar a IA. Tente novamente." }, { status: 502 });
  }

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  if (storeId && message.usage) {
    db.aiUsage.create({
      data: {
        storeId,
        model: "claude-haiku-4-5",
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    }).catch(() => {}); // fire-and-forget, não bloqueia a resposta
  }

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      name: parsed.name ?? null,
      description: parsed.description ?? null,
      highlight: parsed.highlight ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao processar a resposta da IA. Tente novamente.", raw },
      { status: 500 }
    );
  }
}
