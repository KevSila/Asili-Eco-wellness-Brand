import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ExternalLink, LayoutDashboard, LoaderCircle, LogOut, Package, PlusCircle, RefreshCw, Search, ShoppingBag, Users } from "lucide-react";

type View = "dashboard" | "orders" | "sale" | "inventory" | "customers";
type StatusKind = "orderStatus" | "paymentStatus" | "deliveryStatus";
type ProgressStatusKind = Exclude<StatusKind, "paymentStatus">;
export const progressStatusKinds: readonly ProgressStatusKind[] = ["orderStatus", "deliveryStatus"];
type InitialLoadStatus = "idle" | "loading" | "ready" | "error";
export type AdminScreen = "checking" | "login" | "loading" | "error" | "dashboard";

export interface AdminOrder {
  orderReference: string;
  source: string;
  customer: { name: string; phone: string | null; normalizedPhone: string | null; email: string | null };
  deliveryLocation: string | null;
  customerNote: string | null;
  paymentMethod: string | null;
  amountDueMinor: number;
  amountReceivedMinor: number;
  balanceMinor: number;
  paymentHistory: Array<{ method: string; amountMinor: number; currency: string; reference: string | null; status: string; paidAt: string | null; notes: string | null; createdAt: string; countedAsReceived: boolean }>;
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

interface Variant {
  id: string;
  name: string;
  sku: string;
  unitPriceMinor: number;
  currency: string;
  stockQuantity: number | null;
  inventoryMovements?: Array<{ type: string; quantityDelta: number | null; stockBefore: number | null; stockAfter: number | null; reason: string; source: string; createdAt: string; order: { orderNumber: string } | null }>;
}
interface InventoryData { products: Array<{ name: string; variants: Variant[] }> }
interface CustomerSummary { name: string; phone: string | null; email: string | null; orderCount: number; totalProductSpendMinor: number; lastOrderAt: string | null; latestOrderSource: string | null }
interface SalesPeriod { productSalesMinor: number; paidRevenueMinor: number; awaitingPaymentMinor: number; unitsOrdered: number }
interface SalesSummary {
  timeZone: string;
  periodStarts: { today: string; week: string; month: string };
  periods: { today: SalesPeriod; week: SalesPeriod; month: SalesPeriod };
  unitsByVariant: Array<{ productName: string; variantName: string; sku: string | null; unitsOrdered: number; paidUnits: number }>;
  revenueBySource: Array<{ source: string; productSalesMinor: number; paidRevenueMinor: number; awaitingPaymentMinor: number; unitsOrdered: number }>;
}
interface DashboardData {
  metrics: { totalOrders: number; newOrders: number; confirmedOrders: number; pendingPayments: number; pendingDeliveries: number };
  recentOrders: AdminOrder[];
  recentCustomers: Array<{ name: string; phone: string | null; email: string | null; location: string | null; orderCount: number; createdAt: string }>;
  products: Array<{ name: string; active: boolean; variants: Variant[] }>;
  salesSummary: SalesSummary;
}
interface SessionData { user: { email: string; role: string }; expiresAt: string; csrfToken: string }

const statusOptions: Record<StatusKind, string[]> = {
  orderStatus: ["new", "confirmed", "processing", "dispatched", "delivered", "cancelled"],
  paymentStatus: ["pending", "partially_paid", "paid", "refunded"],
  deliveryStatus: ["pending", "scheduled", "dispatched", "delivered"],
};
const money = (minor: number, currency = "KES") => new Intl.NumberFormat("en-KE", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(minor / 100);
const dateTime = (value: string) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const whatsapp = (phone: string, reference?: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(reference ? `Hello, I am following up on your Asili order ${reference}.` : "Hello from Asili.")}`;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (response.status === 401) throw new Error("UNAUTHENTICATED");
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Something went wrong.");
  return body as T;
}

function Badge({ value }: { value: string }) {
  return <span className="rounded-full bg-asili-green/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-asili-green">{label(value)}</span>;
}

export function resolveAdminScreen(input: { checking: boolean; authenticated: boolean; dashboardLoaded: boolean; initialLoadStatus: InitialLoadStatus }): AdminScreen {
  if (input.checking) return "checking";
  if (!input.authenticated) return "login";
  if (input.initialLoadStatus === "error" || (input.initialLoadStatus === "ready" && !input.dashboardLoaded)) return "error";
  if (!input.dashboardLoaded || input.initialLoadStatus === "idle" || input.initialLoadStatus === "loading") return "loading";
  return "dashboard";
}

export default function AdminApp() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [checking, setChecking] = useState(true);
  const [initialLoadStatus, setInitialLoadStatus] = useState<InitialLoadStatus>("idle");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const signOutLocally = useCallback(() => {
    setSession(null); setInitialLoadStatus("idle"); setDashboard(null); setOrders(null); setInventory(null); setCustomers(null); setSelectedOrder(null);
  }, []);

  const loadAll = useCallback(async (initial = false) => {
    if (initial) setInitialLoadStatus("loading");
    setLoading(true); setError("");
    try {
      const [dashboardData, orderData, inventoryData, customerData] = await Promise.all([
        api<DashboardData>("/api/admin/dashboard"), api<{ orders: AdminOrder[] }>("/api/admin/orders"),
        api<InventoryData>("/api/admin/inventory"), api<{ customers: CustomerSummary[] }>("/api/admin/customers"),
      ]);
      if (!dashboardData || !orderData || !Array.isArray(orderData.orders) || !inventoryData || !Array.isArray(inventoryData.products) || !customerData || !Array.isArray(customerData.customers)) {
        throw new Error("The admin data could not be loaded. Please try again.");
      }
      setDashboard(dashboardData); setOrders(orderData.orders); setInventory(inventoryData); setCustomers(customerData.customers);
      setInitialLoadStatus("ready");
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "UNAUTHENTICATED") signOutLocally();
      else {
        setError(requestError instanceof Error ? requestError.message : "Unable to load admin data.");
        if (initial) setInitialLoadStatus("error");
      }
    } finally { setLoading(false); }
  }, [signOutLocally]);

  useEffect(() => { api<SessionData>("/api/admin/auth/session").then((result) => { setInitialLoadStatus("loading"); setSession(result); }).catch(signOutLocally).finally(() => setChecking(false)); }, [signOutLocally]);
  useEffect(() => { if (session) void loadAll(true); }, [session, loadAll]);
  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("order");
    if (session && reference) void openOrder(reference);
    // The deep link is consumed once after authentication.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    try { const authenticatedSession = await api<SessionData>("/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) }); setInitialLoadStatus("loading"); setSession(authenticatedSession); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to sign in."); }
    finally { setLoading(false); }
  };

  const logout = async () => {
    if (!session) return;
    try { await api("/api/admin/auth/logout", { method: "POST", headers: { "X-CSRF-Token": session.csrfToken } }); }
    finally { signOutLocally(); }
  };

  const openOrder = async (reference: string) => {
    setLoading(true); setError("");
    try { const result = await api<{ order: AdminOrder }>(`/api/admin/orders/${encodeURIComponent(reference)}`); setSelectedOrder(result.order); setView("orders"); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load the order."); }
    finally { setLoading(false); }
  };

  const updateStatuses = async (statuses: Partial<Record<StatusKind, string>>) => {
    if (!session || !selectedOrder) return;
    setLoading(true); setError(""); setNotice("");
    try {
      const result = await api<{ order: AdminOrder }>(`/api/admin/orders/${encodeURIComponent(selectedOrder.orderReference)}/statuses`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken }, body: JSON.stringify(statuses) });
      setSelectedOrder(result.order); setNotice("Order progress updated."); await loadAll();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update the order."); }
    finally { setLoading(false); }
  };

  const recordPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!session || !selectedOrder) return;
    const form = event.currentTarget; const data = new FormData(form);
    setLoading(true); setError(""); setNotice("");
    try {
      const result = await api<{ order: AdminOrder }>(`/api/admin/orders/${encodeURIComponent(selectedOrder.orderReference)}/payments`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken }, body: JSON.stringify({ amountMinor: Math.round(Number(data.get("amount")) * 100), method: data.get("method"), reference: data.get("reference"), notes: data.get("notes") }) });
      setSelectedOrder(result.order); setNotice("Payment recorded."); form.reset(); await loadAll();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to record payment."); }
    finally { setLoading(false); }
  };

  const filterOrders = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError("");
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) if (String(value).trim()) query.set(key, String(value).trim());
    try { setOrders((await api<{ orders: AdminOrder[] }>(`/api/admin/orders?${query}`)).orders); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to filter orders."); }
    finally { setLoading(false); }
  };

  const recordSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!session) return;
    setLoading(true); setError(""); setNotice("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const amountReceived = String(data.get("amountReceived") ?? "").trim();
      const result = await api<{ order: AdminOrder }>("/api/admin/sales", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken }, body: JSON.stringify({
        source: data.get("source"), customerName: data.get("customerName"), customerPhone: data.get("customerPhone"), variantId: data.get("variantId"),
        quantity: Number(data.get("quantity")), unitPriceMinor: Math.round(Number(data.get("salePrice")) * 100), paymentStatus: data.get("paymentStatus"), paymentMethod: data.get("paymentMethod"), amountReceivedMinor: amountReceived ? Math.round(Number(amountReceived) * 100) : undefined, note: data.get("note"), deliveryLocation: data.get("deliveryLocation"),
      }) });
      setNotice(`Sale recorded as ${result.order.orderReference}.`); form.reset(); await loadAll();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to record sale."); }
    finally { setLoading(false); }
  };

  const adjustInventory = async (variantId: string, payload: object) => {
    if (!session) return;
    setLoading(true); setError(""); setNotice("");
    try { const result = await api<{ stockQuantity: number | null }>(`/api/admin/inventory/${encodeURIComponent(variantId)}/movements`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken }, body: JSON.stringify(payload) }); setNotice(`Inventory updated. Current stock: ${result.stockQuantity ?? "unconfirmed"}.`); await loadAll(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update inventory."); }
    finally { setLoading(false); }
  };

  const screen = resolveAdminScreen({ checking, authenticated: Boolean(session), dashboardLoaded: dashboard !== null, initialLoadStatus });
  if (screen === "checking") return <AdminLoading message="Checking secure access…" />;
  if (screen === "login") return <Login loading={loading} error={error} onSubmit={login} />;
  if (screen === "loading") return <AdminLoading message="Loading your business data…" />;
  if (screen === "error") return <AdminLoadError error={error} loading={loading} onRetry={() => void loadAll(true)} onLogout={() => void logout()} />;

  const variants = (inventory?.products ?? []).flatMap((product) => (product.variants ?? []).map((variant) => ({ ...variant, productName: product.name })));
  return (
    <div className="min-h-screen bg-[#f3efe5] text-asili-green">
      <header className="sticky top-0 z-20 border-b border-asili-green/10 bg-asili-cream/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><div><p className="text-[9px] font-black uppercase tracking-[0.25em] text-asili-earth">Asili</p><p className="font-serif text-xl">Business Helper</p></div><div className="flex gap-2"><button onClick={() => void loadAll()} className="rounded-full border border-asili-green/15 p-2.5" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><button onClick={() => void logout()} className="flex items-center gap-2 rounded-full bg-asili-green px-4 py-2.5 text-xs font-bold text-white"><LogOut className="h-4 w-4" /> Logout</button></div></div></header>
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav className="sticky top-[73px] z-10 -mx-4 flex gap-2 overflow-x-auto bg-[#f3efe5]/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0 lg:static lg:flex-col lg:bg-transparent lg:py-0" aria-label="Admin navigation">
          {([{ key: "dashboard", title: "Overview", icon: LayoutDashboard }, { key: "orders", title: "Orders", icon: ShoppingBag }, { key: "sale", title: "Record sale", icon: PlusCircle }, { key: "inventory", title: "Inventory", icon: Package }, { key: "customers", title: "Customers", icon: Users }] as const).map(({ key, title, icon: Icon }) => <button key={key} disabled={loading} onClick={() => { setView(key); setSelectedOrder(null); setError(""); setNotice(""); }} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold disabled:opacity-60 sm:px-4 sm:py-3 sm:text-sm lg:w-full ${view === key ? "bg-asili-green text-white" : "bg-white"}`}><Icon className="h-4 w-4" /> {title}</button>)}
        </nav>
        <main className="min-w-0" aria-busy={loading}>{error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
          {view === "dashboard" && <Overview data={dashboard} onOpen={openOrder} />}
          {view === "orders" && !selectedOrder && <OrdersView orders={orders} loading={loading} onFilter={filterOrders} onOpen={openOrder} />}
          {view === "orders" && selectedOrder && <OrderDetail order={selectedOrder} loading={loading} onBack={() => setSelectedOrder(null)} onStatuses={updateStatuses} onPayment={recordPayment} />}
          {view === "sale" && <RecordSale variants={variants} loading={loading} onSubmit={recordSale} />}
          {view === "inventory" && <InventoryView data={inventory} loading={loading} onAdjust={adjustInventory} />}
          {view === "customers" && <CustomersView customers={customers} />}
        </main>
      </div>
    </div>
  );
}

export function AdminLoading({ message }: { message: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-asili-cream px-5 text-asili-green"><div className="text-center"><LoaderCircle className="mx-auto h-8 w-8 animate-spin" /><p className="mt-4 text-sm font-bold">{message}</p></div></main>;
}

export function AdminLoadError({ error, loading, onRetry, onLogout }: { error: string; loading: boolean; onRetry: () => void; onLogout: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-asili-green px-5 py-12"><section className="w-full max-w-md rounded-[2rem] bg-asili-cream p-8 text-asili-green shadow-2xl sm:p-10"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">Asili Business Helper</p><h1 className="mt-4 text-3xl">We couldn’t load the dashboard</h1><p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error || "The admin data is unavailable. Please try again."}</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" disabled={loading} onClick={onRetry} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-asili-honey px-6 py-3.5 text-sm font-black disabled:opacity-60">{loading && <LoaderCircle className="h-4 w-4 animate-spin" />} Try again</button><button type="button" onClick={onLogout} className="rounded-full border border-asili-green/20 px-6 py-3.5 text-sm font-bold">Sign out</button></div></section></main>;
}

export function Login({ loading, error, onSubmit }: { loading: boolean; error: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-asili-green px-5 py-12"><section className="w-full max-w-md rounded-[2rem] bg-asili-cream p-8 shadow-2xl sm:p-10"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-asili-earth">Asili Business Helper</p><h1 className="mt-4 text-4xl">Owner sign in</h1><p className="mt-3 text-sm text-asili-green/65">Secure access for authorised Asili operations.</p><form className="mt-8" onSubmit={onSubmit}><div className="space-y-5"><Field name="email" title="Email" type="email" required /><Field name="password" title="Password" type="password" required /></div>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}<button disabled={loading} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-asili-honey px-6 py-3.5 text-sm font-black disabled:opacity-60">{loading && <LoaderCircle className="h-4 w-4 animate-spin" />} Sign in</button></form><a href="/" className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-asili-green/60"><ArrowLeft className="h-4 w-4" /> Return to Asili</a></section></main>;
}

export function Overview({ data, onOpen }: { data: DashboardData | null; onOpen: (reference: string) => void }) {
  if (!data) return <section><Heading eyebrow="Operations" title="Owner dashboard" /><div className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><Empty text="Dashboard data is not available yet." /></div></section>;
  const metrics = data.metrics;
  const periods = data.salesSummary?.periods;
  return <div className="space-y-6">
    <Heading eyebrow="Operations" title="Owner dashboard" />
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[["Total orders", metrics.totalOrders], ["New orders", metrics.newOrders], ["Confirmed", metrics.confirmedOrders], ["Pending payments", metrics.pendingPayments], ["Pending delivery", metrics.pendingDeliveries]].map(([title, value]) => <article key={String(title)} className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-asili-green/55">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p></article>)}</section>
    {periods && <section><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-2xl">Product sales</h2><p className="mt-1 text-xs text-asili-green/55">Africa/Nairobi business dates · product subtotal only</p></div><p className="text-xs text-asili-green/55">Paid revenue excludes pending, partially paid and refunded orders.</p></div><div className="mt-4 grid gap-3 md:grid-cols-3">{([['Today', periods.today], ['This week', periods.week], ['This month', periods.month]] as const).map(([title, period]) => <article key={title} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-asili-earth">{title}</p><p className="mt-2 text-2xl font-black">{money(period.productSalesMinor)}</p><p className="mt-1 text-xs text-asili-green/55">{period.unitsOrdered} units ordered</p><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-emerald-50 p-3"><span className="block text-emerald-800/70">Paid revenue</span><strong className="mt-1 block text-emerald-900">{money(period.paidRevenueMinor)}</strong></div><div className="rounded-xl bg-amber-50 p-3"><span className="block text-amber-800/70">Awaiting payment</span><strong className="mt-1 block text-amber-900">{money(period.awaitingPaymentMinor)}</strong></div></div></article>)}</div></section>}
    {data.salesSummary && <section className="grid gap-5 xl:grid-cols-2"><article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl">Units by variant this month</h2><div className="mt-4 space-y-3">{data.salesSummary.unitsByVariant.map((variant) => <div key={variant.sku ?? `${variant.productName}-${variant.variantName}`} className="flex items-center justify-between gap-4 rounded-xl bg-asili-cream/60 p-3"><div><p className="font-bold">{variant.variantName}</p><p className="text-xs text-asili-green/50">{variant.productName}</p></div><div className="text-right"><p className="text-xl font-black">{variant.unitsOrdered}</p><p className="text-[10px] text-asili-green/50">{variant.paidUnits} paid</p></div></div>)}{!data.salesSummary.unitsByVariant.length && <Empty text="No product sales this month." />}</div></article><article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl">Sales by channel this month</h2><div className="mt-4 space-y-3">{data.salesSummary.revenueBySource.map((source) => <div key={source.source} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-xl border border-asili-green/10 p-3"><Badge value={source.source} /><strong>{money(source.paidRevenueMinor)}</strong><span className="text-xs text-asili-green/50">{source.unitsOrdered} units · {money(source.productSalesMinor)} sales value</span><span className="text-right text-xs text-amber-700">{money(source.awaitingPaymentMinor)} awaiting</span></div>)}</div></article></section>}
    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl">Recent sales</h2><OrderTable orders={data.recentOrders} onOpen={onOpen} /></section>
  </div>;
}

export function OrdersView({ orders, loading, onFilter, onOpen }: { orders: AdminOrder[] | null; loading?: boolean; onFilter: (event: FormEvent<HTMLFormElement>) => void; onOpen: (reference: string) => void }) {
  return <section><Heading eyebrow="Online and offline" title="Orders & sales" /><form onSubmit={onFilter} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-6"><label className="relative sm:col-span-2"><Search className="absolute left-3 top-3.5 h-4 w-4 text-asili-green/40" /><input name="search" placeholder="Reference, customer or phone" className="w-full rounded-xl border border-asili-green/15 py-3 pl-10 pr-3 text-sm" /></label><Filter name="orderStatus" title="Order status" values={statusOptions.orderStatus} /><Filter name="paymentStatus" title="Payment" values={statusOptions.paymentStatus} /><Filter name="deliveryStatus" title="Delivery" values={statusOptions.deliveryStatus} /><Filter name="source" title="Source" values={["website", "manual", "whatsapp", "phone", "walk_in"]} /><button disabled={loading} className="rounded-xl bg-asili-green px-4 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2 xl:col-span-1">{loading ? "Loading…" : "Apply filters"}</button></form><div className="mt-5 rounded-2xl bg-white p-4 shadow-sm sm:p-5"><OrderTable orders={orders} onOpen={onOpen} /></div></section>;
}

export function RecordSale({ variants, loading, onSubmit }: { variants: Array<Variant & { productName: string }> | null; loading: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const availableVariants = variants ?? [];
  return <section><Heading eyebrow="Offline transaction" title="Record sale" /><form onSubmit={onSubmit} className="mt-6 grid max-w-3xl gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2"><Filter name="source" title="Sale channel" values={["walk_in", "whatsapp", "phone", "manual"]} required /><Field name="customerName" title="Customer name (optional)" /><Field name="customerPhone" title="Kenyan phone (optional)" /><label className="text-sm font-bold sm:col-span-2">Product variant<select name="variantId" required className="mt-2 w-full rounded-xl border border-asili-green/15 bg-white px-3 py-3 font-normal"><option value="">Choose a variant</option>{availableVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.productName} · {variant.name} · {money(variant.unitPriceMinor, variant.currency)} · stock {variant.stockQuantity ?? "unconfirmed"}</option>)}</select></label><Field name="quantity" title="Quantity" type="number" min="1" required /><Field name="salePrice" title="Unit sale price (KES)" type="number" min="0" step="0.01" required /><Filter name="paymentStatus" title="Payment status" values={["pending", "partially_paid", "paid"]} required /><Field name="amountReceived" title="Amount actually received (KES)" type="number" min="0" step="0.01" /><Field name="paymentMethod" title="Payment method" placeholder="Cash, M-Pesa, bank…" required /><Field name="deliveryLocation" title="Delivery/location (optional)" /><Field name="note" title="Note (optional)" /><button disabled={loading || !availableVariants.length} className="rounded-full bg-asili-honey px-6 py-3.5 text-sm font-black sm:col-span-2 disabled:opacity-50">Record sale</button></form></section>;
}


export function InventoryView({ data, loading, onAdjust }: { data: InventoryData | null; loading: boolean; onAdjust: (variantId: string, payload: object) => void }) {
  const products = data?.products ?? [];
  return <section><Heading eyebrow="Stock ledger" title="Inventory" /><p className="mt-3 max-w-2xl text-sm text-asili-green/65">Unconfirmed means no opening quantity has been established. Zero means confirmed out of stock.</p><p className="mt-2 max-w-2xl text-xs text-asili-green/55"><strong>Set actual stock count</strong> replaces the current quantity with your physical count and always requires a reason.</p><div className="mt-6 space-y-5">{products.flatMap((product) => (product.variants ?? []).map((variant) => <div key={variant.id}><InventoryCard product={product.name} variant={variant} loading={loading} onAdjust={onAdjust} /></div>))}{!products.length && <div className="rounded-2xl bg-white p-5 shadow-sm"><Empty text="Inventory data is not available yet." /></div>}</div></section>;
}

function InventoryCard({ product, variant, loading, onAdjust }: { product: string; variant: Variant; loading: boolean; onAdjust: (variantId: string, payload: object) => void }) {
  const [action, setAction] = useState(variant.stockQuantity === null ? "opening_stock" : "stock_received");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onAdjust(variant.id, { action, quantity: data.get("quantity") === "" ? undefined : Number(data.get("quantity")), stockAfter: data.get("stockAfter") === "" ? undefined : Number(data.get("stockAfter")), reason: data.get("reason") }); };
  const help: Record<string, string> = {
    opening_stock: "Use this once to confirm the starting quantity.",
    stock_received: "Adds newly received jars to the current stock.",
    damage: "Removes damaged, lost or unusable jars.",
    correction: "Replaces the current quantity with your physical count. A reason is required for the audit trail.",
    return: "Adds customer returns that can be sold again.",
    stock_unconfirmed: "Removes the confirmed count without assuming the stock is zero.",
  };

  const movements = variant.inventoryMovements ?? [];
  return <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl">{product} · {variant.name}</h2><p className="mt-1 font-mono text-xs text-asili-green/50">{variant.sku}</p></div><div className="rounded-xl bg-asili-cream px-4 py-2 text-right"><p className="text-xs text-asili-green/50">Current stock</p><p className="text-2xl font-black">{variant.stockQuantity === null ? "Unconfirmed" : variant.stockQuantity}</p></div></div><form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><label className="text-xs font-bold">Inventory action<select disabled={loading} value={action} onChange={(event) => setAction(event.target.value)} className="mt-2 w-full rounded-xl border border-asili-green/15 px-3 py-3 text-sm disabled:opacity-60"><option value="opening_stock">Set opening stock</option><option value="stock_received">Receive new stock</option><option value="damage">Record damaged/lost stock</option><option value="correction">Set actual stock count</option><option value="return">Return stock</option><option value="stock_unconfirmed">Mark stock as unconfirmed</option></select><span className="mt-2 block font-normal leading-relaxed text-asili-green/55">{help[action]}</span></label>{action === "correction" ? <Field name="stockAfter" title="Actual counted quantity" type="number" min="0" required /> : action !== "stock_unconfirmed" ? <Field name="quantity" title="Quantity" type="number" min={action === "opening_stock" ? "0" : "1"} required /> : <div />}<Field name="reason" title="Reason / note" required /><button disabled={loading} className="self-end rounded-xl bg-asili-green px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Saving…" : "Save inventory movement"}</button></form><details className="mt-6 border-t border-asili-green/10 pt-4" open={movements.length > 0}><summary className="cursor-pointer text-sm font-bold">Movement history ({movements.length})</summary>{movements.length ? <div className="mt-3 space-y-2">{movements.map((movement, index) => { const delta = movement.quantityDelta; const deltaText = delta === null ? "Count unset" : `${delta > 0 ? "+" : ""}${delta}`; const deltaTone = delta === null ? "text-asili-green/55" : delta > 0 ? "text-emerald-700" : delta < 0 ? "text-red-700" : "text-asili-green"; return <div key={`${movement.createdAt}-${movement.type}-${index}`} className="grid gap-3 rounded-xl bg-asili-cream/55 p-3 text-xs sm:grid-cols-[9rem_1fr_auto]"><div><p className="font-semibold">{dateTime(movement.createdAt)}</p><div className="mt-2"><Badge value={movement.type} /></div></div><div><p className="font-semibold">{movement.reason}</p><p className="mt-1 text-asili-green/55">Source: {label(movement.source)}{movement.order ? ` · Order ${movement.order.orderNumber}` : ""}</p></div><div className="sm:text-right"><p className={`text-lg font-black ${deltaTone}`}>{deltaText}</p><p className="font-mono text-asili-green/55">{movement.stockBefore ?? "?"} → {movement.stockAfter ?? "?"}</p></div></div>; })}</div> : <Empty text="No inventory movements recorded yet." />}</details></article>;
}

export function CustomersView({ customers }: { customers: CustomerSummary[] | null }) {
  const availableCustomers = customers ?? [];
  if (!availableCustomers.length) return <section><Heading eyebrow="Customer history" title="Customers" /><div className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><Empty text={customers === null ? "Customer data is not available yet." : "No customers yet."} /></div></section>;
  return <section><Heading eyebrow="Customer history" title="Customers" /><div className="mt-6 space-y-3 sm:hidden">{availableCustomers.map((customer, index) => <article key={`${customer.phone}-${index}`} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{customer.name}</h2><p className="mt-1 text-xs text-asili-green/60">{customer.phone ?? "No phone"}{customer.email ? ` · ${customer.email}` : ""}</p></div>{customer.latestOrderSource && <Badge value={customer.latestOrderSource} />}</div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><Info term="Orders" value={String(customer.orderCount)} /><Info term="Product spend" value={money(customer.totalProductSpendMinor)} /><Info term="Last order" value={customer.lastOrderAt ? dateTime(customer.lastOrderAt) : "—"} /></div>{customer.phone && <a href={whatsapp(customer.phone)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-[#25D366] px-4 py-2 text-xs font-black text-[#073b1a]">Open WhatsApp</a>}</article>)}</div><div className="mt-6 hidden overflow-x-auto rounded-2xl bg-white p-5 shadow-sm sm:block"><table className="w-full min-w-[48rem] text-left text-sm"><thead className="text-[10px] uppercase tracking-wide text-asili-green/45"><tr><th className="pb-3">Customer</th><th className="pb-3">Contact</th><th className="pb-3">Orders</th><th className="pb-3">Product spend</th><th className="pb-3">Last order</th><th className="pb-3">Source</th><th /></tr></thead><tbody className="divide-y divide-asili-green/10">{availableCustomers.map((customer, index) => <tr key={`${customer.phone}-${index}`}><td className="py-3 font-bold">{customer.name}</td><td className="py-3 text-xs">{customer.phone ?? "No phone"}<br />{customer.email ?? ""}</td><td className="py-3">{customer.orderCount}</td><td className="py-3 font-bold">{money(customer.totalProductSpendMinor)}</td><td className="py-3 text-xs">{customer.lastOrderAt ? dateTime(customer.lastOrderAt) : "—"}</td><td className="py-3">{customer.latestOrderSource ? <Badge value={customer.latestOrderSource} /> : "—"}</td><td className="py-3">{customer.phone && <a href={whatsapp(customer.phone)} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700">WhatsApp</a>}</td></tr>)}</tbody></table></div></section>;
}

function OrderTable({ orders, onOpen }: { orders: AdminOrder[] | null; onOpen: (reference: string) => void }) {
  if (!orders?.length) return <Empty text={orders === null ? "Order data is not available yet." : "No matching orders."} />;
  return <><div className="mt-4 space-y-3 sm:hidden">{orders.map((order) => <button type="button" key={order.orderReference} onClick={() => onOpen(order.orderReference)} className="w-full rounded-xl border border-asili-green/10 p-3 text-left"><div className="flex items-start justify-between gap-3"><span className="font-mono text-xs font-bold">{order.orderReference}</span><Badge value={order.source} /></div><p className="mt-3 font-bold">{order.customer.name}</p><div className="mt-2 flex items-end justify-between gap-3"><div><p className="text-sm font-black">{money(order.totalAmountMinor, order.currency)}</p><p className="text-[10px] text-asili-green/50">{dateTime(order.createdAt)}</p></div><Badge value={order.orderStatus} /></div></button>)}</div><div className="mt-4 hidden overflow-x-auto sm:block"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="text-[10px] uppercase tracking-wide text-asili-green/45"><tr><th className="pb-3">Reference</th><th className="pb-3">Source</th><th className="pb-3">Customer</th><th className="pb-3">Total</th><th className="pb-3">Status</th><th className="pb-3">Created</th></tr></thead><tbody className="divide-y divide-asili-green/10">{orders.map((order) => <tr key={order.orderReference} className="cursor-pointer hover:bg-asili-cream" onClick={() => onOpen(order.orderReference)}><td className="py-3 font-mono text-xs font-bold">{order.orderReference}</td><td className="py-3"><Badge value={order.source} /></td><td className="py-3">{order.customer.name}</td><td className="py-3 font-bold">{money(order.totalAmountMinor, order.currency)}</td><td className="py-3"><Badge value={order.orderStatus} /></td><td className="py-3 text-xs text-asili-green/55">{dateTime(order.createdAt)}</td></tr>)}</tbody></table></div></>;
}

export function OrderDetail({ order, loading, onBack, onStatuses, onPayment }: { order: AdminOrder; loading: boolean; onBack: () => void; onStatuses: (statuses: Partial<Record<StatusKind, string>>) => void; onPayment: (event: FormEvent<HTMLFormElement>) => void }) {
  const [draft, setDraft] = useState<Record<ProgressStatusKind, string>>({ orderStatus: order.orderStatus, deliveryStatus: order.deliveryStatus });
  useEffect(() => setDraft({ orderStatus: order.orderStatus, deliveryStatus: order.deliveryStatus }), [order]);
  return <section className="space-y-5">
    <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> All orders</button>
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-asili-earth">Order detail</p><h1 className="mt-2 break-all font-mono text-xl font-bold sm:text-3xl">{order.orderReference}</h1></div>{order.customer.normalizedPhone && <a href={whatsapp(order.customer.normalizedPhone, order.orderReference)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-black text-[#073b1a]">WhatsApp customer <ExternalLink className="h-4 w-4" /></a>}</div>
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><div className="space-y-5">
      <article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl">Items</h2><div className="mt-4 divide-y divide-asili-green/10">{order.items.map((item, index) => <div key={`${item.sku}-${index}`} className="flex justify-between gap-4 py-4"><div><p className="font-bold">{item.productName} · {item.variantName}</p><p className="text-xs text-asili-green/50">{item.quantity} × {money(item.unitPriceMinor, order.currency)}</p></div><strong>{money(item.lineTotalMinor, order.currency)}</strong></div>)}</div></article>
      <article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl">Payment ledger</h2><div className="mt-4 grid grid-cols-3 gap-2 text-sm"><Info term="Due" value={money(order.amountDueMinor ?? order.totalAmountMinor, order.currency)} /><Info term="Received" value={money(order.amountReceivedMinor ?? 0, order.currency)} /><Info term="Balance" value={money(order.balanceMinor ?? order.totalAmountMinor, order.currency)} /></div><div className="mt-5 space-y-2">{order.paymentHistory?.length ? order.paymentHistory.map((payment, index) => <div key={`${payment.createdAt}-${index}`} className="rounded-xl bg-asili-cream/60 p-3 text-sm"><div className="flex justify-between gap-3"><strong>{money(payment.amountMinor, payment.currency)} · {payment.method}</strong><Badge value={payment.status} /></div><p className="mt-1 text-xs text-asili-green/55">{payment.reference || "No reference"} · {dateTime(payment.paidAt ?? payment.createdAt)}</p>{!payment.countedAsReceived && <p className="mt-1 text-xs text-amber-800">Legacy/status-only row — not counted as received.</p>}</div>) : <Empty text="No payment receipts recorded." />}</div><form onSubmit={onPayment} className="mt-5 grid gap-3 border-t border-asili-green/10 pt-5 sm:grid-cols-2"><Field name="amount" title="Amount received (KES)" type="number" min="0.01" step="0.01" required /><Field name="method" title="Method" placeholder="M-Pesa, cash, bank…" required /><Field name="reference" title="Payment reference (optional)" /><Field name="notes" title="Note (optional)" /><button disabled={loading || (order.balanceMinor ?? 0) <= 0} className="rounded-xl bg-asili-honey px-4 py-3 text-sm font-black sm:col-span-2 disabled:opacity-50">Record payment</button></form></article>
      <article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl">Customer & delivery</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><Info term="Name" value={order.customer.name} /><Info term="Phone" value={order.customer.normalizedPhone ?? "Not provided"} /><Info term="Email" value={order.customer.email ?? "Not provided"} /><Info term="Delivery/location" value={order.deliveryLocation ?? "Not provided"} /><Info term="Note" value={order.customerNote ?? "No note"} /><Info term="Created" value={dateTime(order.createdAt)} /><Info term="Updated" value={dateTime(order.updatedAt)} /></dl></article>
    </div><aside className="rounded-2xl bg-asili-green p-5 text-white xl:sticky xl:top-24 xl:self-start"><h2 className="text-xl">Update progress</h2><div className="mt-5 rounded-xl bg-white/10 p-3"><p className="text-xs font-bold uppercase tracking-wide text-white/60">Payment status</p><p className="mt-1 font-bold">{label(order.paymentStatus)}</p><p className="mt-1 text-xs text-white/65">Updated from recorded payment receipts.</p></div><form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); onStatuses(draft); }}>{progressStatusKinds.map((kind) => <label key={kind} className="block text-xs font-bold uppercase tracking-wide text-white/70">{label(kind)}<select value={draft[kind]} disabled={loading} onChange={(event) => setDraft((current) => ({ ...current, [kind]: event.target.value }))} className="mt-2 w-full rounded-xl bg-white px-3 py-3 text-sm font-semibold text-asili-green">{statusOptions[kind].map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label>)}<button disabled={loading} className="w-full rounded-xl bg-asili-honey px-4 py-3 text-sm font-black text-asili-green disabled:opacity-60">Save progress</button></form></aside></div>
  </section>;
}


function Heading({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-xs font-black uppercase tracking-[0.2em] text-asili-earth">{eyebrow}</p><h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1></div>; }
function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-asili-green/50">{text}</p>; }
function Info({ term, value }: { term: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-asili-green/45">{term}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>; }
function Field(props: { name: string; title: string; type?: string; required?: boolean; min?: string; step?: string; placeholder?: string }) { return <label className="text-sm font-bold">{props.title}<input {...props} className="mt-2 w-full rounded-xl border border-asili-green/15 bg-white px-3 py-3 font-normal" /></label>; }
function Filter({ name, title, values, required }: { name: string; title: string; values: string[]; required?: boolean }) { return <label className="text-xs font-bold">{title}<select name={name} required={required} className="mt-2 w-full rounded-xl border border-asili-green/15 bg-white px-3 py-3 text-sm font-normal"><option value="">{required ? "Choose" : "All"}</option>{values.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>; }
