"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, Check, Upload, ChevronLeft,
  Download, Printer, FileSpreadsheet, FileText,
} from "lucide-react";

type Category = { id: string; namePt: string };

type StoreInfo = {
  namePt: string;
  sloganPt: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  brandHeroImageUrl: string | null;
  brandAboutImageUrl: string | null;
  brandAboutTitlePt: string | null;
  brandAboutTextPt: string | null;
  causeTitlePt: string | null;
  causeTextPt: string | null;
  brandCauseVisible: boolean;
  brandJoinTitlePt: string | null;
  brandJoinTextPt: string | null;
  brandJoinCtaLabel: string | null;
  brandJoinCtaUrl: string | null;
  brandJoinVisible: boolean;
};

type Product = {
  id: string;
  namePt: string;
  descriptionPt: string | null;
  highlightPt: string | null;
  basePrice: number | null;
  isAvailable: boolean;
  categoryId: string;
  tags: string[];
  imageUrl: string | null;
};

type ParsedProduct = {
  name: string;
  description: string | null;
  price: number | null;
};

type ReviewProduct = ParsedProduct & { selected: boolean };

type ReviewCategory = {
  parsedName: string;
  mappedCategoryId: string;
  products: ReviewProduct[];
};

type Props = {
  storeId: string;
  locale: string;
  categories: Category[];
  products: Product[];
  isPaidPlan: boolean;
  store: StoreInfo;
};

const CSV_HEADER = "categoria;nome;descricao;destaque;preco;disponivel;tags";
const CSV_EXAMPLES = [
  "Cafés Quentes;Cappuccino;Café espresso com leite vaporizado;O favorito da casa;9.90;sim;POPULAR",
  "Cafés Quentes;Espresso;Café puro e encorpado;;;5.50;sim;",
  "Sobremesas;Bolo de chocolate;Fatia generosa de bolo caseiro;;12.00;sim;FEATURED",
  "Combos;Café da manhã;Espresso + pão de queijo + suco;;18.90;sim;COMBO",
];

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (const c of line) {
    if (c === '"') { inQ = !inQ; }
    else if (c === ";" && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += c; }
  }
  result.push(cur.trim());
  return result;
}

function downloadBlob(content: string, filename: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportManager({ storeId, locale, categories, products, isPaidPlan, store }: Props) {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<"import" | "export">("import");
  const [importMode, setImportMode] = useState<"ai" | "csv">(isPaidPlan ? "ai" : "csv");
  const [step, setStep] = useState<"input" | "review" | "importing" | "done">("input");

  // AI input
  const [menuText, setMenuText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  // CSV input
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared review/import
  const [reviewData, setReviewData] = useState<ReviewCategory[]>([]);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importError, setImportError] = useState("");
  const [replaceMode, setReplaceMode] = useState<"add" | "replace">("add");

  // ── helpers ──────────────────────────────────────────────────

  function buildReview(parsed: { name: string; products: ParsedProduct[] }[]): ReviewCategory[] {
    return parsed.map((pc) => {
      const match = categories.find((c) => c.namePt.toLowerCase() === pc.name.toLowerCase());
      return {
        parsedName: pc.name,
        mappedCategoryId: match ? match.id : "__new__",
        products: pc.products.map((p) => ({ ...p, selected: true })),
      };
    });
  }

  // ── AI parse ─────────────────────────────────────────────────

  async function handleParseAI() {
    if (!menuText.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: menuText, storeId }),
      });
      const data = await res.json();
      if (!res.ok) { setParseError(data.error ?? "Erro ao analisar."); return; }
      setReviewData(buildReview(data.categories ?? []));
      setStep("review");
    } catch {
      setParseError("Erro de conexão. Tente novamente.");
    } finally {
      setParsing(false);
    }
  }

  // ── CSV parse ────────────────────────────────────────────────

  function handleParseCSV(text: string) {
    setCsvError("");
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("//"));
    if (lines.length < 2) { setCsvError("Arquivo vazio ou sem dados além do cabeçalho."); return; }

    const normalize = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

    const headers = splitCSVLine(lines[0]).map(normalize);
    const col = {
      cat: headers.findIndex((h) => h === "categoria"),
      name: headers.findIndex((h) => h === "nome"),
      desc: headers.findIndex((h) => h === "descricao"),
      price: headers.findIndex((h) => h === "preco"),
    };

    if (col.cat === -1 || col.name === -1) {
      setCsvError("Cabeçalho inválido. Colunas obrigatórias: categoria, nome.");
      return;
    }

    const catMap = new Map<string, ReviewProduct[]>();
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i]);
      const catName = cols[col.cat];
      const name = cols[col.name];
      if (!catName || !name) continue;

      const rawPrice = parseFloat((cols[col.price] ?? "").replace(",", "."));
      const price = isNaN(rawPrice) ? null : rawPrice;
      const description = col.desc >= 0 ? cols[col.desc] || null : null;

      if (!catMap.has(catName)) catMap.set(catName, []);
      catMap.get(catName)!.push({ name, description, price, selected: true });
    }

    if (catMap.size === 0) { setCsvError("Nenhum produto encontrado. Verifique o formato."); return; }

    const result: ReviewCategory[] = [];
    catMap.forEach((prods, parsedName) => {
      const match = categories.find((c) => c.namePt.toLowerCase() === parsedName.toLowerCase());
      result.push({ parsedName, mappedCategoryId: match ? match.id : "__new__", products: prods });
    });

    setReviewData(result);
    setStep("review");
  }

  // ── review actions ───────────────────────────────────────────

  function toggleProduct(ci: number, pi: number) {
    setReviewData((prev) =>
      prev.map((cat, i) =>
        i !== ci ? cat : { ...cat, products: cat.products.map((p, j) => j !== pi ? p : { ...p, selected: !p.selected }) }
      )
    );
  }

  function toggleCategory(ci: number) {
    const all = reviewData[ci].products.every((p) => p.selected);
    setReviewData((prev) =>
      prev.map((cat, i) => i !== ci ? cat : { ...cat, products: cat.products.map((p) => ({ ...p, selected: !all })) })
    );
  }

  function setMapping(ci: number, val: string) {
    setReviewData((prev) => prev.map((cat, i) => i !== ci ? cat : { ...cat, mappedCategoryId: val }));
  }

  const selectedCount = reviewData.reduce((s, c) => s + c.products.filter((p) => p.selected).length, 0);

  // ── import ───────────────────────────────────────────────────

  async function handleImport() {
    setStep("importing");
    setImportError("");
    const total = selectedCount;
    let done = 0;
    setImportProgress({ done: 0, total });

    if (replaceMode === "replace") {
      try {
        const res = await fetch(`/api/admin/products?storeId=${storeId}`, { method: "DELETE" });
        if (!res.ok) {
          setImportError((await res.json().catch(() => ({}))).error ?? "Erro ao apagar produtos existentes.");
          setStep("review");
          return;
        }
      } catch {
        setImportError("Erro de conexão ao apagar produtos existentes.");
        setStep("review");
        return;
      }
    }

    try {
      for (const cat of reviewData) {
        const selected = cat.products.filter((p) => p.selected);
        if (!selected.length) continue;

        let categoryId = cat.mappedCategoryId;
        if (categoryId === "__new__") {
          const res = await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeId, namePt: cat.parsedName }),
          });
          if (!res.ok) {
            setImportError((await res.json().catch(() => ({}))).error ?? `Erro ao criar "${cat.parsedName}".`);
            setStep("review");
            return;
          }
          categoryId = (await res.json()).id;
        }

        for (const p of selected) {
          const res = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeId, categoryId,
              namePt: p.name,
              descriptionPt: p.description || null,
              basePrice: p.price,
              isAvailable: true,
              sortOrder: 0,
              tags: [],
            }),
          });
          if (!res.ok) {
            setImportError((await res.json().catch(() => ({}))).error ?? `Erro ao criar "${p.name}".`);
            setStep("review");
            return;
          }
          done++;
          setImportProgress({ done, total });
        }
      }

      setStep("done");
      router.refresh();
    } catch {
      setImportError("Erro de conexão. Tente novamente.");
      setStep("review");
    }
  }

  // ── export ───────────────────────────────────────────────────

  function downloadTemplate() {
    downloadBlob([CSV_HEADER, ...CSV_EXAMPLES].join("\n"), "modelo-cardapio.csv");
  }

  function exportCSV() {
    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.namePt ?? "";
      return [
        cat, p.namePt, p.descriptionPt ?? "", p.highlightPt ?? "",
        p.basePrice != null ? String(p.basePrice) : "",
        p.isAvailable ? "sim" : "nao",
        p.tags.join("|"),
      ].join(";");
    });
    downloadBlob([CSV_HEADER, ...rows].join("\n"), "cardapio-exportado.csv");
  }

  function printMenu() {
    const grouped = categories
      .map((cat) => ({ ...cat, items: products.filter((p) => p.categoryId === cat.id && p.isAvailable) }))
      .filter((c) => c.items.length > 0);

    const primary = store.primaryColor || "#3A1A00";
    const accent = store.accentColor || "#E86A1A";
    const storeName = store.namePt || "Cardápio";
    const slogan = store.sloganPt || "";
    const logo = store.logoUrl || "";
    const hero = store.brandHeroImageUrl || "";
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    const fmt = (price: number) => `R$ ${price.toFixed(2).replace(".", ",")}`;

    function renderCategory(cat: typeof grouped[0], idx: number) {
      const img = cat.items.find((p) => p.imageUrl);
      const layout = img ? (idx % 2 === 0 ? "right" : "left") : "none";

      const headerHtml = `
        <div style="background:${primary};color:#fff;border-radius:10px 10px 0 0;padding:14px 20px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${cat.namePt}</div>
          <div style="width:40px;height:2px;background:${accent};margin-top:5px;border-radius:2px;"></div>
        </div>`;

      const productList = cat.items.map((item) => `
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px dotted #e0d8d0;gap:12px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;color:#1a1a1a;">${item.namePt}</div>
            ${item.descriptionPt ? `<div style="font-size:12px;color:#888;margin-top:3px;line-height:1.4;">${item.descriptionPt}</div>` : ""}
          </div>
          ${item.basePrice != null ? `<div style="font-size:14px;font-weight:800;color:${accent};white-space:nowrap;flex-shrink:0;">${fmt(item.basePrice)}</div>` : ""}
        </div>`).join("");

      let bodyHtml = "";
      if (layout === "none") {
        bodyHtml = `<div style="padding:4px 20px 16px;">${productList}</div>`;
      } else if (layout === "right") {
        bodyHtml = `
          <div style="display:flex;gap:20px;padding:12px 20px 16px;align-items:flex-start;">
            <div style="flex:1;min-width:0;">${productList}</div>
            <div style="flex:1;flex-shrink:0;">
              <img src="${img!.imageUrl}" style="width:100%;height:220px;object-fit:cover;border-radius:10px;display:block;" />
            </div>
          </div>`;
      } else if (layout === "left") {
        bodyHtml = `
          <div style="display:flex;gap:20px;padding:12px 20px 16px;align-items:flex-start;">
            <div style="flex:1;flex-shrink:0;">
              <img src="${img!.imageUrl}" style="width:100%;height:220px;object-fit:cover;border-radius:10px;display:block;" />
            </div>
            <div style="flex:1;min-width:0;">${productList}</div>
          </div>`;
      }

      return `
        <div style="border:1px solid #e8e0d8;border-radius:12px;margin-bottom:28px;overflow:hidden;page-break-inside:avoid;">
          ${headerHtml}${bodyHtml}
        </div>`;
    }

    const hasCause = store.brandCauseVisible && !!(store.causeTitlePt || store.causeTextPt);
    const hasJoin = store.brandJoinVisible && !!(store.brandJoinTitlePt || store.brandJoinTextPt);
    const hasAbout = !!(store.brandAboutTextPt || store.brandAboutTitlePt || hasCause || hasJoin);

    const divider = `<div style="border-top:1px solid #e8e0d8;margin:32px 0;"></div>`;

    const aboutSection = hasAbout ? `
      <div style="page-break-before:always;padding:48px 0;display:flex;flex-direction:column;align-items:center;text-align:center;">
        ${store.brandAboutImageUrl ? `<img src="${store.brandAboutImageUrl}" style="width:100%;max-height:260px;object-fit:cover;border-radius:16px;margin-bottom:32px;" />` : ""}
        ${store.brandAboutTitlePt || store.brandAboutTextPt ? `
          <div style="width:50px;height:4px;background:${accent};border-radius:2px;margin-bottom:20px;"></div>
          <div style="font-size:22px;font-weight:800;color:${primary};margin-bottom:16px;letter-spacing:1px;">${store.brandAboutTitlePt || "Nossa História"}</div>
          ${store.brandAboutTextPt ? `<p style="font-size:15px;line-height:1.7;color:#555;max-width:520px;margin:0 auto;">${store.brandAboutTextPt}</p>` : ""}
        ` : ""}
        ${hasCause ? `
          ${divider}
          <div style="width:50px;height:4px;background:${accent};border-radius:2px;margin-bottom:20px;"></div>
          <div style="font-size:20px;font-weight:800;color:${primary};margin-bottom:12px;letter-spacing:1px;">${store.causeTitlePt || "Nossa Causa"}</div>
          ${store.causeTextPt ? `<p style="font-size:14px;line-height:1.7;color:#555;max-width:520px;margin:0 auto;">${store.causeTextPt}</p>` : ""}
        ` : ""}
        ${hasJoin ? `
          ${divider}
          <div style="width:50px;height:4px;background:${accent};border-radius:2px;margin-bottom:20px;"></div>
          <div style="font-size:20px;font-weight:800;color:${primary};margin-bottom:12px;letter-spacing:1px;">${store.brandJoinTitlePt || "Faça Parte"}</div>
          ${store.brandJoinTextPt ? `<p style="font-size:14px;line-height:1.7;color:#555;max-width:520px;margin:0 auto;">${store.brandJoinTextPt}</p>` : ""}
          ${store.brandJoinCtaLabel ? `<div style="margin-top:20px;display:inline-block;padding:10px 28px;background:${accent};color:#fff;border-radius:100px;font-size:13px;font-weight:700;letter-spacing:1px;">${store.brandJoinCtaLabel}</div>` : ""}
        ` : ""}
        <div style="margin-top:40px;font-size:12px;color:${primary};font-weight:700;letter-spacing:3px;text-transform:uppercase;opacity:.4;">${storeName}</div>
      </div>` : "";

    const coverBg = hero
      ? `background:url('${hero}') center/cover no-repeat;`
      : `background:linear-gradient(135deg,${primary} 0%,${accent} 100%);`;

    // thead com display:table-header-group repete em cada folha impressa (padrão W3C)
    // @page { margin:0 } + height:297mm na capa = exatamente uma folha A4
    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>${storeName} — Cardápio</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Georgia,serif;color:#1a1a1a;background:#fff;}
  @page{size:A4;margin:0;}
  @media print{.print-btn{display:none!important;}}
  @media screen{body{max-width:740px;margin:0 auto;}}
</style></head><body>

<button class="print-btn" onclick="window.print()" style="position:fixed;top:16px;right:16px;padding:9px 20px;background:${accent};color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:13px;font-family:sans-serif;font-weight:600;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,.2);">Imprimir / PDF</button>

<!-- Capa: height:297mm = exatamente uma folha A4 com @page margin:0 -->
<div style="height:297mm;${coverBg}position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:72px;page-break-after:always;">
  <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.12) 0%,rgba(0,0,0,.65) 100%);"></div>
  <div style="position:relative;text-align:center;padding:0 48px;">
    ${logo ? `<img src="${logo}" style="height:72px;width:auto;object-fit:contain;border-radius:12px;margin-bottom:24px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.4));" />` : ""}
    <div style="font-size:38px;font-weight:800;color:#fff;letter-spacing:4px;text-transform:uppercase;line-height:1.1;text-shadow:0 2px 16px rgba(0,0,0,.5);">${storeName}</div>
    ${slogan ? `<div style="font-size:15px;color:rgba(255,255,255,.85);margin-top:12px;letter-spacing:2px;font-style:italic;">${slogan}</div>` : ""}
    <div style="margin-top:28px;display:inline-block;padding:10px 32px;border:2px solid rgba(255,255,255,.6);border-radius:100px;font-size:12px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#fff;">CARDÁPIO</div>
  </div>
</div>

<!-- Tabela com thead repetido: padrão W3C para cabeçalho em todas as folhas -->
<table style="width:100%;border-collapse:collapse;">
  <thead>
    <tr>
      <td style="background:${primary};padding:10px 32px;height:52px;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${logo ? `<img src="${logo}" style="height:32px;width:auto;object-fit:contain;border-radius:6px;flex-shrink:0;" />` : ""}
          <div style="${logo ? "border-left:1px solid rgba(255,255,255,.25);padding-left:14px;" : ""}">
            <div style="font-size:13px;font-weight:700;color:#fff;letter-spacing:1px;">${storeName}</div>
            ${slogan ? `<div style="font-size:10px;color:rgba(255,255,255,.65);letter-spacing:.5px;">${slogan}</div>` : ""}
          </div>
        </div>
      </td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:28px 40px 16px;vertical-align:top;background:#faf9f7;">
        ${grouped.map((cat, idx) => renderCategory(cat, idx)).join("")}
        ${aboutSection}
        <div style="text-align:right;font-size:9px;color:#bbb;letter-spacing:.5px;margin-top:24px;padding-top:8px;border-top:1px solid #eee;">gerado em ${dateStr}</div>
      </td>
    </tr>
  </tbody>
</table>

</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  }

  // ── styles ───────────────────────────────────────────────────

  const inputBase = "w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400/50";
  const inputStyle = { borderColor: "var(--cream-dark)", background: "white" };

  // ── render ───────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Main tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "var(--cream-dark)" }}>
        {(["import", "export"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setMainTab(tab); setStep("input"); }}
            className="px-5 py-2.5 text-sm font-medium transition-all rounded-t-lg -mb-px"
            style={mainTab === tab
              ? { background: "white", border: "1px solid var(--cream-dark)", borderBottom: "1px solid white", color: "var(--orange)" }
              : { color: "var(--text-muted)" }}
          >
            {tab === "import" ? "Importar" : "Exportar"}
          </button>
        ))}
      </div>

      {/* ===== IMPORT ===== */}
      {mainTab === "import" && (
        <>
          {/* Input step */}
          {step === "input" && (
            <>
              {/* Mode toggle */}
              <div className="flex gap-1.5 p-1 rounded-xl mb-5" style={{ background: "var(--cream-dark)" }}>
                <button
                  onClick={() => { if (isPaidPlan) { setImportMode("ai"); setParseError(""); setCsvError(""); } }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={importMode === "ai"
                    ? { background: "white", color: "var(--text-dark)", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }
                    : { color: isPaidPlan ? "var(--text-muted)" : "var(--text-muted)", opacity: isPaidPlan ? 1 : 0.5 }}
                >
                  ✦ Cole o cardápio (IA){!isPaidPlan && " 🔒"}
                </button>
                <button
                  onClick={() => { setImportMode("csv"); setParseError(""); setCsvError(""); }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={importMode === "csv"
                    ? { background: "white", color: "var(--text-dark)", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }
                    : { color: "var(--text-muted)" }}
                >
                  📄 Arquivo CSV
                </button>
              </div>

              {/* AI input */}
              {importMode === "ai" && (
                <>
                  {isPaidPlan ? (
                    <>
                      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                        Cole qualquer texto — iFood, WhatsApp, lista digitada. A IA organiza automaticamente.
                      </p>
                      <textarea
                        value={menuText}
                        onChange={(e) => setMenuText(e.target.value)}
                        placeholder={"Cafés Quentes\n\nCappuccino - R$ 9,90\nEspresso - R$ 5,50\n\nSobremesas\n\nBolo de chocolate - R$ 12,00"}
                        rows={12}
                        className={inputBase + " resize-none font-mono text-xs leading-relaxed"}
                        style={inputStyle}
                      />
                      {parseError && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl mt-3">{parseError}</p>}
                      <button
                        onClick={handleParseAI}
                        disabled={!menuText.trim() || parsing}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                        style={{ background: "var(--orange)" }}
                      >
                        {parsing
                          ? <><Loader2 size={16} className="animate-spin" /> Analisando...</>
                          : <><Sparkles size={16} /> Analisar com IA</>}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-2xl border border-dashed" style={{ borderColor: "var(--cream-dark)" }}>
                      <Sparkles size={28} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                      <p className="text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
                        Importação com IA — plano pago
                      </p>
                      <p className="text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
                        Cole qualquer texto e a IA organiza o cardápio automaticamente. Disponível nos planos pagos.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* CSV input */}
              {importMode === "csv" && (
                <>
                  {/* Template card */}
                  <div className="rounded-xl p-4 mb-4 border" style={{ borderColor: "var(--cream-dark)", background: "var(--cream)" }}>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-dark)" }}>
                      Baixar modelo
                    </p>
                    <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                      Preencha no Google Sheets ou Excel. Salve como CSV (separador ponto-e-vírgula).
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white"
                      style={{ borderColor: "var(--cream-dark)", color: "var(--text-dark)" }}
                    >
                      <Download size={14} /> modelo-cardapio.csv
                    </button>
                  </div>

                  {/* Columns reference */}
                  <div className="rounded-xl px-4 py-3 mb-4 text-xs" style={{ background: "var(--cream-dark)" }}>
                    <p className="font-semibold mb-2" style={{ color: "var(--text-dark)" }}>Colunas:</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1" style={{ color: "var(--text-muted)" }}>
                      <span><b style={{ color: "var(--text-dark)" }}>categoria</b> — obrigatório</span>
                      <span><b style={{ color: "var(--text-dark)" }}>nome</b> — obrigatório</span>
                      <span><b style={{ color: "var(--text-dark)" }}>descricao</b> — opcional</span>
                      <span><b style={{ color: "var(--text-dark)" }}>destaque</b> — opcional</span>
                      <span><b style={{ color: "var(--text-dark)" }}>preco</b> — ex: 9.90</span>
                      <span><b style={{ color: "var(--text-dark)" }}>disponivel</b> — sim / nao</span>
                      <span className="col-span-2">
                        <b style={{ color: "var(--text-dark)" }}>tags</b> — separadas por |&nbsp;
                        <span className="opacity-70">(POPULAR, SUGGESTED, NEW, COMBO, FEATURED)</span>
                      </span>
                    </div>
                  </div>

                  {/* File drop zone */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => handleParseCSV(reader.result as string);
                      reader.readAsText(file, "utf-8");
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed text-sm transition-colors hover:bg-gray-50"
                    style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
                  >
                    <FileText size={26} className="opacity-40" />
                    Selecionar arquivo CSV
                  </button>
                  {csvError && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl mt-3">{csvError}</p>}
                </>
              )}
            </>
          )}

          {/* Review step */}
          {step === "review" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setStep("input")}
                  className="p-1 rounded-lg hover:bg-gray-100"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-bold" style={{ color: "var(--text-dark)" }}>Revisar produtos</h2>
              </div>
              <p className="text-sm mb-5 ml-8" style={{ color: "var(--text-muted)" }}>
                {selectedCount} produto{selectedCount !== 1 ? "s" : ""} selecionado{selectedCount !== 1 ? "s" : ""}
              </p>

              {importError && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl mb-4">{importError}</p>}

              <div className="space-y-4">
                {reviewData.map((cat, ci) => (
                  <div key={ci} className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--cream-dark)" }}>
                    <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--cream-dark)" }}>
                      <input
                        type="checkbox"
                        checked={cat.products.every((p) => p.selected)}
                        onChange={() => toggleCategory(ci)}
                        className="w-4 h-4 accent-orange-500 flex-shrink-0"
                      />
                      <span className="font-semibold text-sm flex-1" style={{ color: "var(--text-dark)" }}>
                        {cat.parsedName}
                      </span>
                      <select
                        value={cat.mappedCategoryId}
                        onChange={(e) => setMapping(ci, e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-lg border max-w-[180px]"
                        style={{ borderColor: "var(--cream-dark)", background: "white" }}
                      >
                        <option value="__new__">+ Criar nova categoria</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.namePt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {cat.products.map((p, pi) => (
                        <label
                          key={pi}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-t"
                          style={{ borderColor: "var(--cream-dark)" }}
                        >
                          <input
                            type="checkbox"
                            checked={p.selected}
                            onChange={() => toggleProduct(ci, pi)}
                            className="w-4 h-4 accent-orange-500 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: "var(--text-dark)" }}>{p.name}</div>
                            {p.description && (
                              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{p.description}</div>
                            )}
                          </div>
                          {p.price != null && (
                            <span className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--orange)" }}>
                              R$ {p.price.toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Replace mode selector */}
              <div className="mt-6 rounded-2xl border overflow-hidden" style={{ borderColor: "var(--cream-dark)" }}>
                {(["add", "replace"] as const).map((mode) => (
                  <label
                    key={mode}
                    className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                    style={{ borderColor: "var(--cream-dark)" }}
                  >
                    <input
                      type="radio"
                      name="replaceMode"
                      value={mode}
                      checked={replaceMode === mode}
                      onChange={() => setReplaceMode(mode)}
                      className="mt-0.5 accent-orange-500 flex-shrink-0"
                    />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text-dark)" }}>
                        {mode === "add" ? "Adicionar aos produtos existentes" : "Substituir todos os produtos"}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {mode === "add"
                          ? "Os produtos atuais da loja são mantidos e os novos são adicionados."
                          : "Todos os produtos da loja serão apagados antes de importar a nova lista."}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {replaceMode === "replace" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl mt-3">
                  Atenção: esta ação apagará permanentemente todos os produtos atuais da loja.
                </p>
              )}

              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--orange)" }}
              >
                <Upload size={16} />
                Importar {selectedCount} produto{selectedCount !== 1 ? "s" : ""}
              </button>
            </>
          )}

          {/* Importing step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <Loader2 size={40} className="animate-spin" style={{ color: "var(--orange)" }} />
              <p className="font-semibold" style={{ color: "var(--text-dark)" }}>Importando produtos...</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {importProgress.done} de {importProgress.total}
              </p>
              <div className="w-full max-w-xs rounded-full h-2 overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${importProgress.total > 0 ? Math.round((importProgress.done / importProgress.total) * 100) : 0}%`,
                    background: "var(--orange)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Done step */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--orange)" }}>
                <Check size={32} className="text-white" />
              </div>
              <p className="font-semibold text-xl" style={{ color: "var(--text-dark)" }}>Importação concluída!</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {importProgress.total} produto{importProgress.total !== 1 ? "s" : ""} criado{importProgress.total !== 1 ? "s" : ""} com sucesso.
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { setStep("input"); setMenuText(""); setReviewData([]); }}
                  className="px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50"
                  style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
                >
                  Importar mais
                </button>
                <button
                  onClick={() => router.push(`/${locale}/painel/${storeId}/produtos`)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                  style={{ background: "var(--orange)" }}
                >
                  Ver produtos
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== EXPORT ===== */}
      {mainTab === "export" && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: "var(--text-muted)" }}>
              Nenhum produto cadastrado para exportar.
            </p>
          ) : (
            <>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                {products.length} produto{products.length !== 1 ? "s" : ""} disponível{products.length !== 1 ? "is" : ""}.
              </p>

              <button
                onClick={printMenu}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--cream-dark)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--cream-dark)" }}>
                  <Printer size={20} style={{ color: "var(--text-dark)" }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
                    Versão para impressão
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Abre o cardápio formatado — imprima ou salve como PDF
                  </div>
                </div>
              </button>

              <button
                onClick={exportCSV}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--cream-dark)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--cream-dark)" }}>
                  <FileSpreadsheet size={20} style={{ color: "var(--text-dark)" }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
                    Exportar dados (CSV)
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Backup, migração para outro sistema ou edição no Excel / Google Sheets
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
