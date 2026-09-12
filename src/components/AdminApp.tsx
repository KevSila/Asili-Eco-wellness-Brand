import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ExternalLink,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Package,
  RefreshCw,
  ShoppingBag,
  Users,
} from "lucide-react";

type StatusKind = "orderStatus" | "paymentStatus" | "deliveryStatus";

interface AdminOrder {
  orderReference: string;
  customer: { name: string; phone: string; normalizedPhone: string; email: string | null };
  deliveryLocation: string;
  customerNote: string | null;
  currency: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalAmountMinor: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  items: Array<{ productName: string; variantName: string; sku: string | null; unitPriceMinor: number; quantity: number; lineTotalMinor: number }>;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  metrics: { totalOrders: number; newOrders: number; confirmedOrders: number; pendingPayments: number; pendingDeliveries: number };
  recentOrders: AdminOrder[];
  recentCustomers: Array<{ name: string; phone: string; email: string | null; location: string | null; orderCount: number; createdAt: string }>;
  products: Array<{ name: string; slug: string; active: boolean; variants: Array<{ name: string; sku: string; active: boolean; unitPriceMinor: number; currency: string; stockQuantity: number | null }> }>;
}

interface SessionData {
  user: { email: string; role: string };
  expiresAt: string;
  csrfToken: string;
}

const statusOptions: Record<StatusKind, string[]> = {
  orderStatus: ["new", "confirmed", "processing", "dispatched", "delivered", "cancelled"],
  paymentStatus: ["pending", "partially_paid", "paid", "refunded"],
  deliveryStatus: ["pending", "scheduled", "dispatched", "delivered"],
};

const money = (minor: number, currency = "KES") => new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(minor / 100);

const dateTime = (value: string) => new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const whatsapp = (phone: string, reference?: string) => {
  const text = reference ? `Hello, I am following up on your Asili order ${reference}.` : "Hello from Asili.";
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (response.status === 401) throw new Error("UNAUTHENTICATED");
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Something went wrong.");
  return body as T;
}

function StatusBadge({ value }: { value: string }) {
  return <span className="rounded-full bg-asili-green/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-asili-green">{label(value)}</span>;
}

export default function AdminApp() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [view, setView] = useState<"dashboard" | "orders">("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signOutLocally = useCallback(() => {
    setSession(null);
    setDashboard(null);
    setOrders([]);
    setSelectedOrder(null);
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardData, orderData] = await Promise.all([
        api<DashboardData>("/api/admin/dashboard"),
        api<{ orders: AdminOrder[] }>("/api/admin/orders"),
      ]);
      setDashboard(dashboardData);
      setOrders(orderData.orders);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "UNAUTHENTICATED") signOutLocally();
      else setError(requestError instanceof Error ? requestError.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [signOutLocally]);

  useEffect(() => {
    api<SessionData>("/api/admin/auth/session")
      .then(setSession)
      .catch(() => signOutLocally())
      .finally(() => setCheckingSession(false));
  }, [signOutLocally]);

  useEffect(() => {
    if (session) void loadAdminData();
  }, [session, loadAdminData]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const nextSession = await api<SessionData>("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      setSession(nextSession);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!session) return;
    try {
      await api("/api/admin/auth/logout", { method: "POST", headers: { "X-CSRF-Token": session.csrfToken } });
    } finally {
      signOutLocally();
    }
  };

  const openOrder = async (reference: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ order: AdminOrder }>(`/api/admin/orders/${encodeURIComponent(reference)}`);
      setSelectedOrder(result.order);
      setView("orders");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the order.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (kind: StatusKind, value: string) => {
    if (!session || !selectedOrder) return;
    setLoading(true);
    setError("");
    try {
      const result = await api<{ order: AdminOrder }>(`/api/admin/orders/${encodeURIComponent(selectedOrder.orderReference)}/statuses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken },
        body: JSON.stringify({ [kind]: value }),
      });
      setSelectedOrder(result.order);
      await loadAdminData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update the order.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <div className="flex min-h-screen items-center justify-center bg-asili-cream text-asili-green"><LoaderCircle className="h-8 w-8 animate-spin" aria-label="Checking session" /></div>;

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-asili-green px-5 py-12">
        <section className="w-full max-w-md rounded-[2rem] bg-asili-cream p-8 shadow-2xl sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">Asili Business Helper</p>
          <h1 className="mt-4 text-4xl text-asili-green">Owner sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-asili-green/65">Secure access for authorised Asili operations.</p>
          <form className="mt-8 space-y-5" onSubmit={login}>
            <label className="block text-sm font-bold text-asili-green">Email<input name="email" type="email" required autoComplete="username" className="mt-2 w-full rounded-xl border border-asili-green/15 bg-white px-4 py-3 font-normal outline-none focus:border-asili-honey" /></label>
            <label className="block text-sm font-bold text-asili-green">Password<input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-asili-green/15 bg-white px-4 py-3 font-normal outline-none focus:border-asili-honey" /></label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-asili-honey px-6 py-3.5 text-sm font-black text-asili-green disabled:opacity-60">{loading && <LoaderCircle className="h-4 w-4 animate-spin" />} Sign in</button>
          </form>
          <a href="/" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-asili-green/60"><ArrowLeft className="h-4 w-4" /> Return to Asili</a>
        </section>
      </main>
    );
  }

  const metrics = dashboard?.metrics;
  return (
    <div className="min-h-screen bg-[#f3efe5] text-asili-green">
      <header className="sticky top-0 z-20 border-b border-asili-green/10 bg-asili-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div><p className="text-[9px] font-black uppercase tracking-[0.25em] text-asili-earth">Asili</p><p className="font-serif text-xl">Business Helper</p></div>
          <div className="flex items-center gap-2"><button onClick={() => void loadAdminData()} className="rounded-full border border-asili-green/15 p-2.5" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><button onClick={() => void logout()} className="flex items-center gap-2 rounded-full bg-asili-green px-4 py-2.5 text-xs font-bold text-white"><LogOut className="h-4 w-4" /> Logout</button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_1fr]">
        <nav className="flex gap-2 lg:flex-col" aria-label="Admin navigation">
          <button onClick={() => { setView("dashboard"); setSelectedOrder(null); }} className={`flex flex-1 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold lg:flex-none ${view === "dashboard" ? "bg-asili-green text-white" : "bg-white"}`}><LayoutDashboard className="h-4 w-4" /> Overview</button>
          <button onClick={() => { setView("orders"); setSelectedOrder(null); }} className={`flex flex-1 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold lg:flex-none ${view === "orders" ? "bg-asili-green text-white" : "bg-white"}`}><ShoppingBag className="h-4 w-4" /> Orders</button>
        </nav>
        <main>
          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {view === "dashboard" && (
            <div className="space-y-6">
              <div><p className="text-xs font-black uppercase tracking-[0.2em] text-asili-earth">Operations</p><h1 className="mt-2 text-3xl sm:text-4xl">Owner dashboard</h1></div>
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {[["Total orders", metrics?.totalOrders], ["New orders", metrics?.newOrders], ["Confirmed", metrics?.confirmedOrders], ["Pending payments", metrics?.pendingPayments], ["Pending delivery", metrics?.pendingDeliveries]].map(([title, value]) => <article key={String(title)} className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-asili-green/55">{title}</p><p className="mt-2 text-3xl font-bold">{value ?? "—"}</p></article>)}
              </section>
              <section className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl"><ShoppingBag className="h-5 w-5 text-asili-earth" /> Recent orders</h2><OrderTable orders={dashboard?.recentOrders ?? []} onOpen={openOrder} /></article>
                <article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl"><Users className="h-5 w-5 text-asili-earth" /> Recent customers</h2><div className="mt-4 divide-y divide-asili-green/10">{dashboard?.recentCustomers.length ? dashboard.recentCustomers.map((customer) => <div key={`${customer.phone}-${customer.createdAt}`} className="py-3"><div className="flex justify-between gap-3"><div><p className="font-bold">{customer.name}</p><p className="text-xs text-asili-green/55">{customer.phone} · {customer.location ?? "No location"}</p></div><span className="text-xs font-bold">{customer.orderCount} order{customer.orderCount === 1 ? "" : "s"}</span></div></div>) : <Empty text="No customers yet." />}</div></article>
              </section>
              <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl"><Package className="h-5 w-5 text-asili-earth" /> Product availability</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{dashboard?.products.flatMap((product) => product.variants.map((variant) => <div key={variant.sku} className="rounded-xl border border-asili-green/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{product.name} · {variant.name}</p><p className="mt-1 font-mono text-xs text-asili-green/50">{variant.sku}</p></div><StatusBadge value={variant.active && product.active ? "active" : "inactive"} /></div><p className="mt-3 text-sm">{money(variant.unitPriceMinor, variant.currency)} · Stock: {variant.stockQuantity === null ? "Unconfirmed" : variant.stockQuantity}</p></div>))}</div></section>
            </div>
          )}
          {view === "orders" && !selectedOrder && <section><p className="text-xs font-black uppercase tracking-[0.2em] text-asili-earth">Operations</p><h1 className="mt-2 text-3xl sm:text-4xl">Orders</h1><div className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><OrderTable orders={orders} onOpen={openOrder} /></div></section>}
          {view === "orders" && selectedOrder && <OrderDetail order={selectedOrder} loading={loading} onBack={() => setSelectedOrder(null)} onStatus={updateStatus} />}
        </main>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-asili-green/50">{text}</p>; }

function OrderTable({ orders, onOpen }: { orders: AdminOrder[]; onOpen: (reference: string) => void }) {
  if (!orders.length) return <Empty text="No orders yet." />;
  return <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[36rem] text-left text-sm"><thead className="text-[10px] uppercase tracking-wide text-asili-green/45"><tr><th className="pb-3">Reference</th><th className="pb-3">Customer</th><th className="pb-3">Total</th><th className="pb-3">Status</th><th className="pb-3">Created</th></tr></thead><tbody className="divide-y divide-asili-green/10">{orders.map((order) => <tr key={order.orderReference} className="cursor-pointer hover:bg-asili-cream" onClick={() => onOpen(order.orderReference)}><td className="py-3 font-mono text-xs font-bold">{order.orderReference}</td><td className="py-3">{order.customer.name}</td><td className="py-3 font-bold">{money(order.totalAmountMinor, order.currency)}</td><td className="py-3"><StatusBadge value={order.orderStatus} /></td><td className="py-3 text-xs text-asili-green/55">{dateTime(order.createdAt)}</td></tr>)}</tbody></table></div>;
}

function OrderDetail({ order, loading, onBack, onStatus }: { order: AdminOrder; loading: boolean; onBack: () => void; onStatus: (kind: StatusKind, value: string) => void }) {
  return <section className="space-y-5"><button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> All orders</button><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-asili-earth">Order detail</p><h1 className="mt-2 font-mono text-2xl font-bold sm:text-3xl">{order.orderReference}</h1></div><a href={whatsapp(order.customer.normalizedPhone, order.orderReference)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-black text-[#073b1a]">WhatsApp customer <ExternalLink className="h-4 w-4" /></a></div><div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><div className="space-y-5"><article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl">Items</h2><div className="mt-4 divide-y divide-asili-green/10">{order.items.map((item, index) => <div key={`${item.sku}-${index}`} className="flex justify-between gap-4 py-4"><div><p className="font-bold">{item.productName} · {item.variantName}</p><p className="mt-1 font-mono text-xs text-asili-green/50">{item.sku ?? "No SKU"} · {item.quantity} × {money(item.unitPriceMinor, order.currency)}</p></div><p className="font-bold">{money(item.lineTotalMinor, order.currency)}</p></div>)}</div><div className="mt-4 space-y-2 border-t border-asili-green/15 pt-4 text-sm"><p className="flex justify-between"><span>Product subtotal</span><strong>{money(order.subtotalMinor, order.currency)}</strong></p><p className="flex justify-between"><span>Delivery fee</span><strong>{order.deliveryFeeMinor ? money(order.deliveryFeeMinor, order.currency) : "Confirm separately"}</strong></p><p className="flex justify-between text-base"><span>Total recorded</span><strong>{money(order.totalAmountMinor, order.currency)}</strong></p></div></article><article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl">Customer & delivery</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><Info term="Name" value={order.customer.name} /><Info term="Phone" value={order.customer.normalizedPhone} /><Info term="Email" value={order.customer.email ?? "Not provided"} /><Info term="Delivery location" value={order.deliveryLocation} /><Info term="Customer note" value={order.customerNote ?? "No note"} /><Info term="Created" value={dateTime(order.createdAt)} /><Info term="Last updated" value={dateTime(order.updatedAt)} /></dl></article></div><aside className="rounded-2xl bg-asili-green p-5 text-white shadow-sm"><h2 className="text-xl">Update progress</h2><p className="mt-2 text-xs leading-relaxed text-white/60">Only forward operational transitions are accepted.</p><div className="mt-6 space-y-5">{(["orderStatus", "paymentStatus", "deliveryStatus"] as StatusKind[]).map((kind) => <label key={kind} className="block text-xs font-bold uppercase tracking-wide text-white/70">{label(kind)}<select value={order[kind]} disabled={loading} onChange={(event) => void onStatus(kind, event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white px-3 py-3 text-sm font-semibold text-asili-green outline-none">{statusOptions[kind].map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label>)}</div></aside></div></section>;
}

function Info({ term, value }: { term: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-asili-green/45">{term}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>; }
