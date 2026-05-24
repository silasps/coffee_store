"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Trash2, RefreshCw, Download } from "lucide-react";
import { formatCurrency } from "@/components/ui/format-currency";

type FinanceEntry = {
  id: string;
  direction: string;
  category: string;
  description: string;
  amount: number;
  happenedAt: string;
  notes: string | null;
  orderId: string | null;
  order: { displayCode: string; paymentMethod: string | null } | null;
};

type Props = {
  storeId: string;
  initialEntries: FinanceEntry[];
  initialIncome: number;
  initialExpense: number;
  initialMonth: number;
  initialYear: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  SALE: "Venda", SUPPLY_PURCHASE: "Insumos", OPERATIONS: "Operações",
  RENT: "Aluguel", PAYROLL: "Folha", TAXES: "Impostos",
  UTILITIES: "Serviços", MARKETING: "Marketing", MAINTENANCE: "Manutenção",
  EQUIPMENT: "Equipamentos",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX", CARD_ONLINE: "Cartão Online", PAY_LINK: "Link Pgto",
  PAY_AT_COUNTER: "Balcão", CASH_AT_COUNTER: "Dinheiro", CARD_AT_COUNTER: "Cartão",
};

const INCOME_CATS = ["SALE"];
const EXPENSE_CATS = ["SUPPLY_PURCHASE", "OPERATIONS", "RENT", "PAYROLL", "TAXES", "UTILITIES", "MARKETING", "MAINTENANCE", "EQUIPMENT"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function getCategoryLabel(category: string, notes: string | null): string {
  if (category === "OTHER" && notes?.startsWith("_label:")) {
    return notes.split("\n")[0].replace("_label:", "");
  }
  return CATEGORY_LABELS[category] ?? category;
}

function extractNotes(notes: string | null): string | null {
  if (!notes) return null;
  if (notes.startsWith("_label:")) {
    const rest = notes.split("\n").slice(1).join("\n").trim();
    return rest || null;
  }
  return notes;
}

function groupByDate(entries: FinanceEntry[]) {
  const groups: Record<string, FinanceEntry[]> = {};
  for (const e of entries) {
    const key = e.happenedAt.slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function dateHeader(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function formatOFXDate(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

const EMPTY_FORM = {
  direction: "EXPENSE" as "INCOME" | "EXPENSE",
  category: "SUPPLY_PURCHASE", description: "", amount: "",
  happenedAt: new Date().toISOString().slice(0, 10), notes: "", customCategory: "",
};

export function FinanceManager({ storeId, initialEntries, initialIncome, initialExpense, initialMonth, initialYear }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [income, setIncome] = useState(initialIncome);
  const [expense, setExpense] = useState(initialExpense);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [dateMode, setDateMode] = useState<"month" | "custom">("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  function buildDateRange(isEnd = false) {
    if (dateMode === "month") {
      return isEnd
        ? new Date(year, month + 1, 0, 23, 59, 59).toISOString()
        : new Date(year, month, 1).toISOString();
    }
    return isEnd
      ? new Date(customTo + "T23:59:59").toISOString()
      : new Date(customFrom).toISOString();
  }

  function getPeriodLabel() {
    if (dateMode === "month") return `${MONTHS[month]}-${year}`;
    if (customFrom && customTo) return `${customFrom}_${customTo}`;
    return "relatorio";
  }

  async function loadData(from: string, to: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/finance?storeId=${storeId}&from=${from}&to=${to}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries); setIncome(data.income); setExpense(data.expense);
    }
    setLoading(false);
  }

  async function load(m: number, y: number) {
    await loadData(
      new Date(y, m, 1).toISOString(),
      new Date(y, m + 1, 0, 23, 59, 59).toISOString(),
    );
  }

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y); load(m, y);
  }

  async function applyCustomRange() {
    if (!customFrom || !customTo) return;
    await loadData(
      new Date(customFrom).toISOString(),
      new Date(customTo + "T23:59:59").toISOString(),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = form.amount.replace(/\D/g, "");
    const amount = parseInt(digits || "0", 10) / 100;
    if (!amount || isNaN(amount) || amount <= 0) return;
    const res = await fetch("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId, direction: form.direction, category: form.category,
        description: form.description, amount, happenedAt: form.happenedAt,
        notes: form.customCategory
          ? `_label:${form.customCategory}${form.notes ? "\n" + form.notes : ""}`
          : form.notes || null,
      }),
    });
    if (res.ok) {
      setShowForm(false); setForm(EMPTY_FORM);
      await load(month, year);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/finance?id=${id}`, { method: "DELETE" });
    await load(month, year);
    setDeleting(null);
  }

  // ── EXPORT ────────────────────────────────────────────────────────────────

  async function exportData(format: "csv" | "pdf" | "ofx") {
    setExporting(true);
    setShowExportMenu(false);

    // Open PDF window synchronously before the async fetch (avoids popup blockers)
    let pdfWin: Window | null = null;
    if (format === "pdf") {
      pdfWin = window.open("", "_blank");
      if (pdfWin) {
        pdfWin.document.write(`<html><head><title>Relatório</title></head><body style="font-family:Arial;padding:40px;color:#555">Carregando relatório...</body></html>`);
      }
    }

    const from = buildDateRange(false);
    const to = buildDateRange(true);
    const url = `/api/admin/finance?storeId=${storeId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&export=1`;
    const res = await fetch(url);
    const data = await res.json();

    let all: FinanceEntry[] = data.entries ?? [];
    if (filter !== "ALL") all = all.filter((e) => e.direction === filter);
    if (filterCategory) all = all.filter((e) => e.category === filterCategory);

    const totalIncome = Number(data.income ?? 0);
    const totalExpense = Number(data.expense ?? 0);

    if (format === "csv") generateCSV(all, totalIncome, totalExpense);
    else if (format === "ofx") generateOFX(all);
    else if (format === "pdf" && pdfWin) populatePDF(pdfWin, all, totalIncome, totalExpense);

    setExporting(false);
  }

  function generateCSV(rows: FinanceEntry[], totalIncome: number, totalExpense: number) {
    const BOM = "﻿";
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const sep = ";";

    const header = ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)", "Pedido", "Forma de Pagamento", "Observação"];
    const lines = rows.map((e) => [
      e.happenedAt.slice(0, 10),
      e.description,
      getCategoryLabel(e.category, e.notes),
      e.direction === "INCOME" ? "Receita" : "Despesa",
      (e.direction === "INCOME" ? e.amount : -e.amount).toFixed(2).replace(".", ","),
      e.order ? `#${e.order.displayCode}` : "",
      e.order?.paymentMethod ? (PAYMENT_METHOD_LABELS[e.order.paymentMethod] ?? e.order.paymentMethod) : "",
      extractNotes(e.notes) ?? "",
    ].map(esc).join(sep));

    const bal = totalIncome - totalExpense;
    const totals = [
      "",
      ["", "", "", "Receitas", totalIncome.toFixed(2).replace(".", ","), "", "", ""].map(esc).join(sep),
      ["", "", "", "Despesas", (-totalExpense).toFixed(2).replace(".", ","), "", "", ""].map(esc).join(sep),
      ["", "", "", "Saldo", bal.toFixed(2).replace(".", ","), "", "", ""].map(esc).join(sep),
    ];

    const csv = BOM + [header.map(esc).join(sep), ...lines, ...totals].join("\n");
    triggerDownload(csv, `relatorio-${getPeriodLabel()}.csv`, "text/csv;charset=utf-8");
  }

  function generateOFX(rows: FinanceEntry[]) {
    const now = formatOFXDate(new Date().toISOString());
    const dtStart = rows.length > 0 ? formatOFXDate(rows[rows.length - 1].happenedAt) : now;
    const dtEnd = rows.length > 0 ? formatOFXDate(rows[0].happenedAt) : now;

    const transactions = rows.map((e) => {
      const trnType = e.direction === "INCOME" ? "CREDIT" : "DEBIT";
      const amount = e.direction === "INCOME" ? e.amount : -e.amount;
      const memo = `${e.description} - ${getCategoryLabel(e.category, e.notes)}`.replace(/[<>&]/g, " ");
      return `<STMTTRN>
<TRNTYPE>${trnType}
<DTPOSTED>${formatOFXDate(e.happenedAt)}
<TRNAMT>${amount.toFixed(2)}
<FITID>${e.id}
<MEMO>${memo}
</STMTTRN>`;
    }).join("\n");

    const balance = rows.reduce((s, e) => e.direction === "INCOME" ? s + e.amount : s - e.amount, 0);

    const ofx = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${now}
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>COFFEESTORE
<ACCTID>${storeId}
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${dtStart}
<DTEND>${dtEnd}
${transactions}
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>${balance.toFixed(2)}
<DTASOF>${now}
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

    triggerDownload(ofx, `relatorio-${getPeriodLabel()}.ofx`, "text/plain;charset=utf-8");
  }

  function populatePDF(win: Window, rows: FinanceEntry[], totalIncome: number, totalExpense: number) {
    const periodLabel = dateMode === "month"
      ? `${MONTHS[month]} de ${year}`
      : `${customFrom} a ${customTo}`;
    const balance = totalIncome - totalExpense;
    const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

    const tableRows = rows.map((e) => {
      const color = e.direction === "INCOME" ? "#16a34a" : "#dc2626";
      const sign = e.direction === "INCOME" ? "" : "-";
      return `<tr>
        <td>${e.happenedAt.slice(0, 10)}</td>
        <td>${e.description}</td>
        <td>${getCategoryLabel(e.category, e.notes)}</td>
        <td>${e.direction === "INCOME" ? "Receita" : "Despesa"}</td>
        <td style="text-align:right;color:${color};font-weight:600">${sign}${fmt(e.amount)}</td>
        <td>${e.order ? `#${e.order.displayCode}` : ""}</td>
        <td>${e.order?.paymentMethod ? (PAYMENT_METHOD_LABELS[e.order.paymentMethod] ?? e.order.paymentMethod) : ""}</td>
        <td style="color:#888">${extractNotes(e.notes) ?? ""}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Financeiro — ${periodLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; padding: 32px; }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .period { color: #777; font-size: 13px; margin-bottom: 20px; }
    .totals { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .total { padding: 10px 18px; border-radius: 8px; font-size: 13px; }
    .t-income { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .t-income strong { color: #16a34a; }
    .t-expense { background: #fef2f2; border: 1px solid #fecaca; }
    .t-expense strong { color: #dc2626; }
    .t-balance { background: #eff6ff; border: 1px solid #bfdbfe; }
    .t-balance strong { color: #1d4ed8; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead th { background: #f5f5f5; text-align: left; padding: 7px 8px; border: 1px solid #ddd; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; }
    tbody td { padding: 5px 8px; border: 1px solid #eee; vertical-align: top; }
    tbody tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 24px; color: #aaa; font-size: 10px; }
    @media print { body { padding: 16px; } button { display: none; } }
  </style>
</head>
<body>
  <h1>Relatório Financeiro</h1>
  <p class="period">Período: ${periodLabel} &nbsp;·&nbsp; ${rows.length} lançamento${rows.length !== 1 ? "s" : ""}</p>
  <div class="totals">
    <div class="total t-income">Receitas<br><strong>${fmt(totalIncome)}</strong></div>
    <div class="total t-expense">Despesas<br><strong>${fmt(totalExpense)}</strong></div>
    <div class="total t-balance">Saldo<br><strong>${fmt(balance)}</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th>
        <th style="text-align:right">Valor</th><th>Pedido</th><th>Pagamento</th><th>Observação</th>
      </tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#aaa">Nenhum lançamento</td></tr>'}</tbody>
  </table>
  <p class="footer">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  // ── COMPUTED ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = entries;
    if (filter !== "ALL") list = list.filter((e) => e.direction === filter);
    if (filterCategory) list = list.filter((e) => e.category === filterCategory);
    return list;
  }, [entries, filter, filterCategory]);

  const balance = income - expense;
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const isIncome = form.direction === "INCOME";
  const accentColor = isIncome ? "#16a34a" : "#dc2626";

  const availableCategories = useMemo(() => {
    if (filter === "INCOME") return [...INCOME_CATS];
    if (filter === "EXPENSE") return [...EXPENSE_CATS];
    return [...INCOME_CATS, ...EXPENSE_CATS];
  }, [filter]);

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  if (showForm) return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-5 pb-7 flex-shrink-0" style={{ background: accentColor }}>
        <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5">
          <ArrowLeft size={15} /> Voltar
        </button>
        <p className="text-white/70 text-sm mb-1">{isIncome ? "Receita" : "Despesa"}</p>
        <input
          type="text" inputMode="numeric"
          value={form.amount}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            const cents = parseInt(digits || "0", 10);
            const formatted = (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            setForm((f) => ({ ...f, amount: digits ? formatted : "" }));
          }}
          placeholder="R$ 0,00"
          className="text-4xl font-black text-white bg-transparent border-none outline-none w-full placeholder-white/30 mb-5"
        />
        <div className="flex rounded-full p-1 gap-1" style={{ background: "rgba(0,0,0,0.25)" }}>
          {(["EXPENSE", "INCOME"] as const).map((d) => (
            <button key={d} type="button"
              onClick={() => setForm((f) => ({ ...f, direction: d, category: d === "INCOME" ? "SALE" : "SUPPLY_PURCHASE" }))}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
              style={form.direction === d ? { background: "white", color: accentColor } : { color: "rgba(255,255,255,0.7)" }}>
              {d === "EXPENSE" ? "Despesa" : "Receita"}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-white">
        {[
          {
            label: "Descrição", required: true,
            icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
            content: (
              <input required value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Sem descrição"
                className="w-full text-sm font-medium text-text-dark bg-transparent outline-none placeholder-gray-300"
              />
            ),
          },
          {
            label: "Categoria", required: true,
            icon: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
            content: (
              <div className="flex flex-col gap-2 pt-0.5">
                <div className="flex flex-wrap gap-1.5">
                  {(isIncome ? INCOME_CATS : EXPENSE_CATS).map((c) => (
                    <button key={c} type="button"
                      onClick={() => setForm((f) => ({ ...f, category: c, customCategory: "" }))}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={form.category === c ? { background: accentColor, color: "white" } : { background: "#f1ece6", color: "#6b5c53" }}>
                      {CATEGORY_LABELS[c]}
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, category: "OTHER", customCategory: f.category === "OTHER" ? f.customCategory : "" }))}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1"
                    style={form.category === "OTHER" ? { background: accentColor, color: "white" } : { background: "#f1ece6", color: "#6b5c53" }}>
                    <Plus size={11} /> Adicionar
                  </button>
                </div>
                {form.category === "OTHER" && (
                  <input autoFocus value={form.customCategory}
                    onChange={(e) => setForm((f) => ({ ...f, customCategory: e.target.value }))}
                    placeholder="Nome da categoria..."
                    className="text-sm font-medium text-text-dark rounded-lg px-3 py-1.5 outline-none border"
                    style={{ background: "#faf7f4", borderColor: "#e8ddd6" }}
                  />
                )}
              </div>
            ),
          },
          {
            label: "Data",
            icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
            content: (
              <input type="date" value={form.happenedAt}
                onChange={(e) => setForm((f) => ({ ...f, happenedAt: e.target.value }))}
                className="w-full text-sm font-medium text-text-dark bg-transparent outline-none"
              />
            ),
          },
          {
            label: "Observação",
            icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
            content: (
              <input value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Sem observação"
                className="w-full text-sm font-medium text-text-dark bg-transparent outline-none placeholder-gray-300"
              />
            ),
          },
        ].map((field, i) => (
          <div key={i} className="flex items-center px-5 py-4 gap-4 border-b" style={{ borderColor: "#f1ece6" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#f5f0eb" }}>
              <svg width="16" height="16" fill="none" stroke="#9b8476" strokeWidth="2" viewBox="0 0 24 24">{field.icon}</svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</p>
              {field.content}
            </div>
          </div>
        ))}

        <div className="p-5">
          <button type="submit" className="w-full py-4 rounded-2xl text-white font-bold text-base" style={{ background: accentColor }}>
            Salvar {isIncome ? "Receita" : "Despesa"}
          </button>
        </div>
      </form>
    </div>
  );

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="p-5 overflow-y-auto h-full" onClick={() => showExportMenu && setShowExportMenu(false)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-dark">Financeiro</h1>
        <div className="flex items-center gap-2">
          {/* Export button */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowExportMenu((v) => !v); }}
              disabled={exporting}
              className="w-10 h-10 flex items-center justify-center rounded-full border transition-colors disabled:opacity-40"
              style={{ borderColor: "var(--cream-dark)", background: "white", color: "#9b8476" }}
              title="Exportar relatório"
            >
              {exporting
                ? <RefreshCw size={16} className="animate-spin" />
                : <Download size={16} />
              }
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 top-12 z-50 rounded-2xl border shadow-lg overflow-hidden min-w-48"
                style={{ background: "white", borderColor: "var(--cream-dark)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs text-gray-400 font-semibold px-4 pt-3 pb-1 uppercase tracking-wide">Exportar relatório</p>
                {([
                  { fmt: "csv" as const, label: "CSV — Planilha Excel", sub: "Excel · Google Sheets · Omie" },
                  { fmt: "pdf" as const, label: "PDF — Relatório", sub: "Imprimir ou enviar ao contador" },
                  { fmt: "ofx" as const, label: "OFX — Contabilidade", sub: "ContaAzul · Conta Simples" },
                ] as const).map(({ fmt, label, sub }) => (
                  <button key={fmt} onClick={() => exportData(fmt)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-t"
                    style={{ borderColor: "var(--cream-dark)" }}>
                    <p className="text-sm font-semibold text-text-dark">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New entry button */}
          <button
            onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white shadow-md"
            style={{ background: "var(--orange)" }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Period & filters card */}
      <div className="rounded-2xl border p-4 mb-3" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
        {/* Direction filter + refresh */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-dark">Período e filtros</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => dateMode === "month" ? load(month, year) : applyCustomRange()}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <RefreshCw size={14} className="text-gray-400" />
            </button>
            {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setFilterCategory(null); }}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                style={filter === f ? { background: "var(--orange)", color: "white" } : { background: "var(--cream)", color: "var(--text-muted)" }}>
                {f === "ALL" ? "Todos" : f === "INCOME" ? "Receitas" : "Despesas"}
              </button>
            ))}
          </div>
        </div>

        {/* Date mode toggle */}
        <div className="flex items-center gap-2 mb-3">
          {(["month", "custom"] as const).map((mode) => (
            <button key={mode} type="button"
              onClick={() => setDateMode(mode)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={dateMode === mode ? { background: "#1e293b", color: "white" } : { background: "var(--cream)", color: "var(--text-muted)" }}>
              {mode === "month" ? "Por mês" : "Período personalizado"}
            </button>
          ))}
        </div>

        {/* Month navigation */}
        {dateMode === "month" && (
          <div className="flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-gray-100">
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
            <span className="text-sm text-gray-300 w-20 text-center hidden sm:block">{MONTHS[month === 0 ? 11 : month - 1]}</span>
            <span className="text-base font-bold text-text-dark">{MONTHS[month]} {year}</span>
            <span className="text-sm text-gray-300 w-20 text-center hidden sm:block">{MONTHS[month === 11 ? 0 : month + 1]}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-gray-100">
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* Custom date range */}
        {dateMode === "custom" && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex flex-col gap-0.5 flex-1 min-w-28">
              <label className="text-xs text-gray-400">De</label>
              <input type="date" value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-sm font-medium text-text-dark rounded-lg px-2 py-1.5 border outline-none"
                style={{ background: "#faf7f4", borderColor: "#e8ddd6" }}
              />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-28">
              <label className="text-xs text-gray-400">Até</label>
              <input type="date" value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-sm font-medium text-text-dark rounded-lg px-2 py-1.5 border outline-none"
                style={{ background: "#faf7f4", borderColor: "#e8ddd6" }}
              />
            </div>
            <button
              onClick={applyCustomRange}
              disabled={!customFrom || !customTo || loading}
              className="mt-4 px-4 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: "var(--orange)" }}
            >
              Aplicar
            </button>
          </div>
        )}

        {/* Category filter chips */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--cream-dark)" }}>
          <p className="text-xs text-gray-400 mb-2">Categoria</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterCategory(null)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={!filterCategory ? { background: "#1e293b", color: "white" } : { background: "var(--cream)", color: "var(--text-muted)" }}>
              Todas
            </button>
            {availableCategories.map((c) => (
              <button key={c}
                onClick={() => setFilterCategory(filterCategory === c ? null : c)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                style={filterCategory === c ? { background: "#1e293b", color: "white" } : { background: "var(--cream)", color: "var(--text-muted)" }}>
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary toggle */}
      <div className="flex justify-end mb-1">
        <button onClick={() => setShowDetails((v) => !v)} className="text-xs text-gray-400 flex items-center gap-1">
          {showDetails ? "Ocultar detalhes" : "Ver detalhes"}
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {showDetails ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
          </svg>
        </button>
      </div>

      {/* Summary grid */}
      {showDetails && (
        <div className="rounded-2xl border overflow-hidden mb-4" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          {([
            [
              { dot: "#3B82F6", label: "Saldo hoje", value: balance },
              { dot: "#8B5CF6", label: `Balanço de ${MONTHS[month]}`, value: balance },
            ],
            [
              { dot: "#10B981", label: "Receitas", value: income, color: "#10B981" },
              { dot: "#EF4444", label: "Despesas", value: expense, color: "#EF4444" },
            ],
          ] as { dot: string; label: string; value: number; color?: string }[][]).map((row, ri) => (
            <div key={ri} className="grid grid-cols-2" style={ri < 1 ? { borderBottom: "1px solid var(--cream-dark)" } : {}}>
              {row.map((item, ci) => (
                <div key={ci} className="p-4" style={ci === 0 ? { borderRight: "1px solid var(--cream-dark)" } : {}}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.dot }} />
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                  <p className="text-base font-black" style={{ color: item.color ?? (item.value >= 0 ? "#10B981" : "#EF4444") }}>
                    {formatCurrency(item.value)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Filter count badge */}
      {(filter !== "ALL" || filterCategory) && (
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs text-gray-400">
            {filtered.length} lançamento{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
          <button onClick={() => { setFilter("ALL"); setFilterCategory(null); }}
            className="text-xs text-orange-500 font-semibold hover:underline">
            Limpar filtros
          </button>
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Carregando...</div>
      ) : grouped.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">Nenhum lançamento neste período</div>
      ) : (
        grouped.map(([date, group]) => (
          <div key={date} className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
              {dateHeader(date)}
            </p>
            <div className="flex flex-col gap-2">
              {group.map((entry) => (
                <div key={entry.id} className="rounded-2xl border p-4" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-dark text-sm leading-tight">{entry.description}</p>
                      {entry.order && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">Pedido #{entry.order.displayCode}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <p className="font-black text-base" style={{ color: entry.direction === "INCOME" ? "#10B981" : "#EF4444" }}>
                        {entry.direction === "INCOME" ? "" : "-"}{formatCurrency(entry.amount)}
                      </p>
                      {!entry.orderId && (
                        <button onClick={() => handleDelete(entry.id)} disabled={deleting === entry.id}
                          className="p-1 rounded-lg text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--cream)", color: "var(--text-muted)" }}>
                      {getCategoryLabel(entry.category, entry.notes)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={entry.direction === "INCOME"
                        ? { background: "#10B98115", color: "#10B981" }
                        : { background: "#EF444415", color: "#EF4444" }}>
                      {entry.direction === "INCOME" ? "Receita" : "Despesa"}
                    </span>
                    {entry.order?.paymentMethod && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f1ece6", color: "#6b5c53" }}>
                        {PAYMENT_METHOD_LABELS[entry.order.paymentMethod] ?? entry.order.paymentMethod}
                      </span>
                    )}
                    {extractNotes(entry.notes) && <span className="text-xs text-gray-400">{extractNotes(entry.notes)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
