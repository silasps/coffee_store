"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, Trash2, X, CheckCircle, CreditCard, Banknote, QrCode, Search } from "lucide-react";

type Category = {
  id: string;
  namePt: string;
  iconEmoji: string | null;
};

type Product = {
  id: string;
  slug: string;
  categoryId: string;
  namePt: string;
  imageUrl: string | null;
  basePrice: number | null;
};

type CartItem = {
  productId: string;
  productSlug: string;
  productNamePt: string;
  unitPrice: number;
  quantity: number;
};

type Props = {
  storeId: string;
  storeSlug: string;
  categories: Category[];
  products: Product[];
};

type PaymentMethod = "CASH_AT_COUNTER" | "CARD_AT_COUNTER" | "PIX";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "CASH_AT_COUNTER", label: "Dinheiro", icon: <Banknote size={16} /> },
  { value: "CARD_AT_COUNTER", label: "Cartão", icon: <CreditCard size={16} /> },
  { value: "PIX", label: "PIX", icon: <QrCode size={16} /> },
];

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function VendaClient({ storeId, storeSlug, categories, products }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_AT_COUNTER");
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<PaymentMethod | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  function normalize(str: string) {
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  const filteredProducts = useMemo(() => {
    const query = normalize(search.trim());
    return products.filter((p) => {
      const matchesCategory = !activeCategoryId || p.categoryId === activeCategoryId;
      const matchesSearch = !query || normalize(p.namePt).includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryId, search, products]);

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product) {
    if (!product.basePrice) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productSlug: product.slug,
          productNamePt: product.namePt,
          unitPrice: product.basePrice!,
          quantity: 1,
        },
      ];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  function resetSale() {
    setCart([]);
    setCustomerName("");
    setNotes("");
    setPaymentMethod("CASH_AT_COUNTER");
    setSuccessCode(null);
    setSuccessPayment(null);
    setCartOpen(false);
  }

  async function handleSubmit() {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          storeSlug,
          customerName: customerName.trim() || "Balcão",
          notes: notes.trim() || undefined,
          paymentMethod,
          channel: "COUNTER",
          items: cart.map((item) => ({
            productId: item.productId,
            productSlug: item.productSlug,
            productNamePt: item.productNamePt,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
          subtotal: cartTotal,
          total: cartTotal,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar pedido");
      setSuccessCode(json.displayCode);
      setSuccessPayment(paymentMethod);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao registrar venda");
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successCode) {
    const isPix = successPayment === "PIX";
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-6 p-8" style={{ background: "var(--cream)" }}>
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center max-w-sm w-full shadow-lg"
          style={{ background: "var(--brown-dark)" }}
        >
          <CheckCircle size={48} className="text-green-400" />
          <div>
            <p className="text-cream/60 text-sm mb-1">Pedido registrado</p>
            <p className="text-white text-4xl font-bold tracking-widest">#{successCode}</p>
          </div>
          {isPix ? (
            <p className="text-cream/60 text-sm">
              Confirme o pagamento PIX na tela de{" "}
              <span className="text-cream font-medium">Pedidos</span> para entrar na fila.
            </p>
          ) : (
            <p className="text-green-400 text-sm font-medium">Pagamento confirmado · Pedido na fila</p>
          )}
          <button
            onClick={resetSale}
            className="mt-2 w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--orange)" }}
          >
            Nova Venda
          </button>
        </div>
      </div>
    );
  }

  // ── Cart panel (shared between desktop sidebar and mobile drawer) ───────────
  const CartPanel = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--brown-mid)" }}>
        <h2 className="font-semibold text-white text-sm">Carrinho</h2>
        <button onClick={() => setCartOpen(false)} className="md:hidden text-cream/60 hover:text-cream">
          <X size={18} />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {cart.length === 0 ? (
          <p className="text-cream/40 text-sm text-center mt-8">Nenhum item</p>
        ) : (
          cart.map((item) => (
            <div
              key={item.productId}
              className="rounded-lg p-2.5 flex items-center gap-2"
              style={{ background: "var(--brown-mid)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{item.productNamePt}</p>
                <p className="text-cream/60 text-xs">{formatPrice(item.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQty(item.productId, -1)}
                  className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-cream hover:bg-white/20 transition-colors"
                >
                  <Minus size={10} />
                </button>
                <span className="text-white text-xs w-5 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.productId, 1)}
                  className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-cream hover:bg-white/20 transition-colors"
                >
                  <Plus size={10} />
                </button>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-red-400 hover:bg-red-400/20 ml-1 transition-colors"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout fields + total */}
      <div className="p-3 border-t flex flex-col gap-3" style={{ borderColor: "var(--brown-mid)" }}>
        <input
          type="text"
          placeholder="Nome do cliente (opcional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-cream/40 border outline-none focus:border-orange-400 transition-colors"
          style={{ background: "var(--brown-mid)", borderColor: "var(--brown-light)" }}
        />
        <input
          type="text"
          placeholder="Observações (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-cream/40 border outline-none focus:border-orange-400 transition-colors"
          style={{ background: "var(--brown-mid)", borderColor: "var(--brown-light)" }}
        />

        {/* Payment method */}
        <div className="flex gap-1.5">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPaymentMethod(opt.value)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium border transition-colors"
              style={
                paymentMethod === opt.value
                  ? { background: "var(--orange)", borderColor: "var(--orange)", color: "white" }
                  : { background: "var(--brown-mid)", borderColor: "var(--brown-light)", color: "rgba(253,246,238,0.6)" }
              }
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-cream/60 text-sm">Total</span>
          <span className="text-white font-bold text-base">{formatPrice(cartTotal)}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || cart.length === 0}
          className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--orange)" }}
        >
          {loading ? "Registrando…" : "Confirmar Venda"}
        </button>
      </div>
    </div>
  );

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: "var(--cream)" }}>

      {/* Products panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div
          className="px-3 py-2 border-b flex-shrink-0"
          style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
        >
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cream/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar produto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm text-white placeholder-cream/40 border outline-none focus:border-orange-400 transition-colors"
              style={{ background: "var(--brown-mid)", borderColor: "var(--brown-light)" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div
          className="flex items-center gap-1 px-3 py-2.5 border-b overflow-x-auto scrollbar-hide flex-shrink-0"
          style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
        >
          <button
            onClick={() => setActiveCategoryId(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={
              activeCategoryId === null
                ? { background: "var(--orange)", color: "white" }
                : { color: "var(--cream)", background: "transparent" }
            }
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={
                activeCategoryId === cat.id
                  ? { background: "var(--orange)", color: "white" }
                  : { color: "var(--cream)", background: "transparent" }
              }
            >
              {cat.iconEmoji && <span>{cat.iconEmoji}</span>}
              {cat.namePt}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-sm mt-12" style={{ color: "var(--brown-mid)" }}>
              Nenhum produto nesta categoria
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.productId === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={!product.basePrice}
                    className="relative rounded-xl overflow-hidden text-left flex flex-col transition-transform active:scale-95 disabled:opacity-40"
                    style={{ background: "var(--brown-dark)" }}
                  >
                    {/* Image */}
                    <div className="aspect-square w-full relative bg-black/20">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.namePt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">☕</div>
                      )}
                      {inCart && (
                        <div
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: "var(--orange)" }}
                        >
                          {inCart.quantity}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      <p className="text-white text-xs font-medium leading-tight line-clamp-2">{product.namePt}</p>
                      {product.basePrice ? (
                        <p className="text-cream/60 text-xs mt-1">{formatPrice(product.basePrice)}</p>
                      ) : (
                        <p className="text-cream/30 text-xs mt-1">Sem preço</p>
                      )}
                    </div>
                    {/* Add overlay */}
                    <div
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-lg flex items-center justify-center"
                      style={{ background: "var(--orange)" }}
                    >
                      <Plus size={12} className="text-white" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop cart sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 border-l flex-shrink-0"
        style={{ background: "var(--brown-dark)", borderColor: "var(--brown-mid)" }}
      >
        {CartPanel}
      </aside>

      {/* ── Mobile floating cart button ──────────────────────────────────────── */}
      {!cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white"
          style={{ background: "var(--orange)" }}
        >
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center" style={{ color: "var(--orange)" }}>
              {cartCount}
            </span>
          )}
        </button>
      )}

      {/* ── Mobile cart drawer ───────────────────────────────────────────────── */}
      {cartOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setCartOpen(false)} />
          <div
            className="md:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-2xl flex flex-col"
            style={{ background: "var(--brown-dark)", maxHeight: "85dvh" }}
          >
            {CartPanel}
          </div>
        </>
      )}
    </div>
  );
}
