import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminLoadError,
  AdminLoading,
  CustomersView,
  InventoryView,
  Login,
  OrdersView,
  Overview,
  RecordSale,
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

  it("routes an unauthenticated fresh session to a usable login form", () => {
    expect(resolveAdminScreen({ checking: false, authenticated: false, dashboardLoaded: false, initialLoadStatus: "idle" })).toBe("login");
    const markup = renderToStaticMarkup(<Login loading={false} error="" onSubmit={vi.fn()} />);
    expect(markup).toContain("Owner sign in");
    expect(markup).toContain('type="password"');
    expect(markup).toContain("Return to Asili");
  });
});
