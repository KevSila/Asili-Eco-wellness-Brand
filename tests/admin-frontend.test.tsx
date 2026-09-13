import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminLoadError,
  AdminLoading,
  CustomersView,
  InventoryView,
  Login,
  OrdersView,
  OrderDetail,
  Overview,
  RecordSale,
  progressStatusKinds,
  resolveAdminScreen,
} from "../src/components/AdminApp";

describe("admin frontend startup states", () => {
  it("keeps an authenticated session on a loading screen until dashboard data exists", () => {
    expect(resolveAdminScreen({ checking: false, authenticated: true, dashboardLoaded: false, initialLoadStatus: "loading" })).toBe("loading");
    expect(renderToStaticMarkup(<AdminLoading message="Loading your business data…" />)).toContain("Loading your business data");
  });

  it("does not treat a null dashboard as ready and Overview handles null defensively", () => {
    expect(resolveAdminScreen({ checking: false, authenticated: true, dashboardLoaded: false, initialLoadStatus: "ready" })).toBe("error");
    expect(renderToStaticMarkup(<Overview data={null} onOpen={vi.fn()} />)).toContain("Dashboard data is not available yet");
  });

  it("renders a readable retry state after the initial dashboard API load fails", () => {
    expect(resolveAdminScreen({ checking: false, authenticated: true, dashboardLoaded: false, initialLoadStatus: "error" })).toBe("error");
    const markup = renderToStaticMarkup(<AdminLoadError error="The admin API is not available." loading={false} onRetry={vi.fn()} onLogout={vi.fn()} />);
    expect(markup).toContain("We couldn’t load the dashboard");
    expect(markup).toContain("The admin API is not available.");
    expect(markup).toContain("Try again");
  });

  it("keeps inventory, customers, record-sale and orders views safe when startup data is unavailable", () => {
    expect(renderToStaticMarkup(<InventoryView data={null} loading={false} onAdjust={vi.fn()} />)).toContain("Inventory data is not available yet");
    expect(renderToStaticMarkup(<CustomersView customers={null} />)).toContain("Customer data is not available yet");
    expect(renderToStaticMarkup(<RecordSale variants={null} loading={false} onSubmit={vi.fn()} />)).toContain("Record sale");
    expect(renderToStaticMarkup(<OrdersView orders={null} onFilter={vi.fn()} onOpen={vi.fn()} />)).toContain("Order data is not available yet");
  });

  it("renders understandable inventory wording and complete movement history without internal IDs", () => {
    const markup = renderToStaticMarkup(<InventoryView loading={false} onAdjust={vi.fn()} data={{ products: [{ name: "Asili Raw Makueni Honey", variants: [{ id: "variant-internal", name: "500g", sku: "ASILI-HONEY-500G", unitPriceMinor: 60000, currency: "KES", stockQuantity: 15, inventoryMovements: [{ type: "STOCK_RECEIVED", quantityDelta: 5, stockBefore: 10, stockAfter: 15, reason: "New delivery received", source: "ADMIN", createdAt: "2026-09-13T09:00:00.000Z", order: { orderNumber: "ASILI-260913-TEST" } }] }] }] }} />);
    expect(markup).toContain("Receive new stock");
    expect(markup).toContain("Set actual stock count");
    expect(markup).toContain("replaces the current quantity");
    expect(markup).toContain("New delivery received");
    expect(markup).toContain("+5");
    expect(markup).toContain("10");
    expect(markup).toContain("15");
    expect(markup).toContain("ASILI-260913-TEST");
    expect(markup).not.toContain("movement-internal");
  });

  it("routes an unauthenticated fresh session to a usable login form", () => {
    expect(resolveAdminScreen({ checking: false, authenticated: false, dashboardLoaded: false, initialLoadStatus: "idle" })).toBe("login");
    const markup = renderToStaticMarkup(<Login loading={false} error="" onSubmit={vi.fn()} />);
    expect(markup).toContain("Owner sign in");
    expect(markup).toContain('type="password"');
    expect(markup).toContain("Return to Asili");
  });

  it("shows explicit workflow saving and auditable payment balances", () => {
    const markup = renderToStaticMarkup(<OrderDetail loading={false} onBack={vi.fn()} onStatuses={vi.fn()} onPayment={vi.fn()} order={{ orderReference: "ASILI-TEST", source: "website", customer: { name: "Customer", phone: "+254712345678", normalizedPhone: "+254712345678", email: null }, deliveryLocation: "Nairobi", customerNote: null, paymentMethod: "M-Pesa", amountDueMinor: 60000, amountReceivedMinor: 20000, balanceMinor: 40000, paymentHistory: [{ method: "M-Pesa", amountMinor: 20000, currency: "KES", reference: "TEST-REF", status: "paid", paidAt: "2026-09-13T10:00:00.000Z", notes: null, createdAt: "2026-09-13T10:00:00.000Z", countedAsReceived: true }], currency: "KES", subtotalMinor: 60000, deliveryFeeMinor: 0, totalAmountMinor: 60000, orderStatus: "new", paymentStatus: "partially_paid", deliveryStatus: "pending", items: [{ productName: "Asili Raw Makueni Honey", variantName: "500g", sku: "ASILI-HONEY-500G", unitPriceMinor: 60000, quantity: 1, lineTotalMinor: 60000 }], createdAt: "2026-09-13T09:00:00.000Z", updatedAt: "2026-09-13T10:00:00.000Z" }} />);
    expect(markup).toContain("Save progress");
    expect(markup).toContain("Payment ledger");
    expect(markup).toContain("Ksh 200");
    expect(markup).toContain("Ksh 400");
    expect(markup).toContain("TEST-REF");
    expect(markup).toContain("Updated from recorded payment receipts");
    expect(progressStatusKinds).toEqual(["orderStatus", "deliveryStatus"]);
    expect(progressStatusKinds).not.toContain("paymentStatus");
    expect(markup.match(/<select/g)).toHaveLength(2);
  });
});
