import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada." }, { status: 500 });
  }

  const { text, storeId } = await req.json();
  if (!text || !storeId) {
    return NextResponse.json({ error: "text e storeId são obrigatórios" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: `You are a menu parser for a coffee shop management system.
Your task: extract a structured menu from raw text (from iFood, WhatsApp, or any other source).

Rules:
- Identify categories/sections (e.g., "Cafés Quentes", "Sobremesas", "Combos")
- For each category, identify products with: name, price (number, BRL), description (if present)
- If no category is mentioned, use "Cardápio" as the default category
- Clean up product names (remove emojis, extra spaces, numbering like "1.", "•", "-", etc.)
- Prices: extract as numbers (e.g., "R$ 9,90" → 9.90, "12,00" → 12.00, null if not found)
- Descriptions: extract if present after the product name/price, otherwise null

Respond ONLY with a valid JSON object in this exact format:
{
  "categories": [
    {
      "name": "Category Name",
      "products": [
        { "name": "Product Name", "description": "optional description or null", "price": 9.90 }
      ]
    }
  ]
}

Do not include any explanation, markdown, or extra text — only the JSON object.`,
    messages: [
      {
        role: "user",
        content: `Parse this menu:\n\n${text}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  if (storeId && message.usage) {
    db.aiUsage.create({
      data: {
        storeId,
        model: "claude-haiku-4-5",
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    }).catch(() => {});
  }

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Falha ao processar resposta da IA.", raw }, { status: 500 });
  }
}
