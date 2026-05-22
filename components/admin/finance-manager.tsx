"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Trash2, RefreshCw } from "lucide-react";
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
  order: { displayCode: string } | null;
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
  EQUIPMENT: "Equipamentos", OTHER: "Outros",
};

const EXPENSE_CATS = ["SUPPLY_PURCHASE","OPERATIONS","RENT","PAYROLL","TAXES","UTILITIES","MARKETING","MAINTENANCE","EQUIPMENT","OTHER"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

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

const EMPTY_FORM = { direction: "EXPENSE" as "INCOME"|"EXPENSE", category: "SUPPLY_PURCHASE", description: "", amount: "", happenedAt: new Date().toISOString().slice(0,10), notes: "" };

export function FinanceManager({ storeId, initialEntries, initialIncome, initialExpense, initialMonth, initialYear }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [income, setIncome] = useState(initialIncome);
  const [expense, setExpense] = useState(initialExpense);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"ALL"|"INCOME"|"EXPENSE">("ALL");
  const [deleting, setDeleting] = useState<string|null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load(m: number, y: number) {
    setLoading(true);
    const from = new Date(y, m, 1).toISOString();
    const to = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
    const res = await fetch(`/api/admin/finance?storeId=${storeId}&from=${from}&to=${to}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries); setIncome(data.income); setExpense(data.expense);
    }
    setLoading(false);
  }

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y); load(m, y);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount.replace(",", "."));
    if (!amount || isNaN(amount) || amount <= 0) return;
    const res = await fetch("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, direction: form.direction, category: form.category, description: form.description, amount, happenedAt: form.happenedAt, notes: form.notes || null }),
    });
    if (res.ok) { setShowForm(false); setForm(EMPTY_FORM); await load(month, year); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/finance?id=${id}`, { method: "DELETE" });
    await load(month, year);
    setDeleting(null);
  }

  const filtered = entries.filter((e) => filter === "ALL" || e.direction === filter);
  const balance = income - expense;
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const isIncome = form.direction === "INCOME";
  const accentColor = isIncome ? "#16a34a" : "#dc2626";

  /* ── FORM VIEW ─────────────────────────────────────────── */
  if (showForm) return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-5 pb-7 flex-shrink-0" style={{ background: accentColor }}>
        <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5">
          <ArrowLeft size={15} /> Voltar
        </button>
        <p className="text-white/70 text-sm mb-1">{isIncome ? "Receita" : "Despesa"}</p>
        <input
          type="text" inputMode="decimal"
          value={form.amount ? `R$ ${form.amount}` : ""}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9.,]/g, "") }))}
          placeholder="R$ 0,00"
          className="text-4xl font-black text-white bg-transparent border-none outline-none w-full placeholder-white/30 mb-5"
        />
        <div className="flex rounded-full p-1 gap-1" style={{ background: "rgba(0,0,0,0.25)" }}>
          {(["EXPENSE","INCOME"] as const).map((d) => (
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
            icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>,
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
            icon: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
            content: (
              <select value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full text-sm font-medium text-text-dark bg-transparent outline-none">
                {(isIncome ? ["SALE","OTHER"] : EXPENSE_CATS).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            ),
          },
          {
            label: "Data",
            icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
            content: (
              <input type="date" value={form.happenedAt}
                onChange={(e) => setForm((f) => ({ ...f, happenedAt: e.target.value }))}
                className="w-full text-sm font-medium text-text-dark bg-transparent outline-none"
              />
            ),
          },
          {
            label: "Observação",
            icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
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

  /* ── LIST VIEW ─────────────────────────────────────────── */
  return (
    <div className="p-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-dark">Financeiro</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white shadow-md"
          style={{ background: "var(--orange)" }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Period card */}
      <div className="rounded-2xl border p-4 mb-3" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-dark">Período e filtros</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => load(month, year)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <RefreshCw size={14} className="text-gray-400" />
            </button>
            {(["ALL","INCOME","EXPENSE"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                style={filter === f ? { background: "var(--orange)", color: "white" } : { background: "var(--cream)", color: "var(--text-muted)" }}>
                {f === "ALL" ? "Todos" : f === "INCOME" ? "Receitas" : "Despesas"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-gray-100">
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <span className="text-sm text-gray-300 w-20 text-center hidden sm:block">
            {MONTHS[month === 0 ? 11 : month - 1]}
          </span>
          <span className="text-base font-bold text-text-dark">{MONTHS[month]} {year}</span>
          <span className="text-sm text-gray-300 w-20 text-center hidden sm:block">
            {MONTHS[month === 11 ? 0 : month + 1]}
          </span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-gray-100">
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Summary toggle */}
      <div className="flex justify-end mb-1">
        <button onClick={() => setShowDetails((v) => !v)} className="text-xs text-gray-400 flex items-center gap-1">
          {showDetails ? "Ocultar detalhes" : "Ver detalhes"}
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {showDetails ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
          </svg>
        </button>
      </div>

      {/* Summary grid */}
      {showDetails && (
        <div className="rounded-2xl border overflow-hidden mb-4" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          {([
            [
              { dot: "#3B82F6", label: "Saldo hoje",              value: balance },
              { dot: "#8B5CF6", label: `Balanço de ${MONTHS[month]}`, value: balance },
            ],
            [
              { dot: "#10B981", label: "Receitas",  value: income,   color: "#10B981" },
              { dot: "#EF4444", label: "Despesas",  value: expense,  color: "#EF4444" },
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
                      {CATEGORY_LABELS[entry.category] ?? entry.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={entry.direction === "INCOME"
                        ? { background: "#10B98115", color: "#10B981" }
                        : { background: "#EF444415", color: "#EF4444" }}>
                      {entry.direction === "INCOME" ? "Receita" : "Despesa"}
                    </span>
                    {entry.notes && <span className="text-xs text-gray-400">{entry.notes}</span>}
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
