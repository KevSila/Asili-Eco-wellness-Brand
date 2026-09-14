import { describe, expect, it, vi } from "vitest";
import { revealOrderConfirmation } from "../src/components/HoneyOrderForm";
import { orderFormHref } from "../src/lib/order-links";
import { publicHoneyFunnel } from "../src/lib/public-funnel";
import { installRenderedHashScrolling, scrollToRenderedHash } from "../src/lib/hash-scroll";

describe("honey order confirmation UX", () => {
  it("routes ordering CTAs directly to the stable honey form anchor", () => {
    expect(orderFormHref("home")).toBe("/honey/#order");
    expect(orderFormHref("honey")).toBe("#order");
  });

  it("keeps the homepage order, exploration and WhatsApp enquiry paths distinct", () => {
    expect(publicHoneyFunnel.orderOnline).toBe("/honey/#order");
    expect(publicHoneyFunnel.explore).toBe("/honey/");
    expect(publicHoneyFunnel.whatsappEnquiry).toMatch(/^https:\/\/wa\.me\/254717578394\?text=/);
  });
  it("updates the stable confirmation hash, centres it, and moves focus", () => {
    const replaceState = vi.fn();
    const scrollIntoView = vi.fn();
    const focus = vi.fn();
    revealOrderConfirmation(
      { scrollIntoView, focus } as unknown as HTMLElement,
      { history: { replaceState } } as unknown as Window,
    );
    expect(replaceState).toHaveBeenCalledWith(null, "", "#order-confirmation");
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("scrolls and focuses a directly loaded /honey/#order target after render", () => {
    const scrollIntoView = vi.fn();
    const focus = vi.fn();
    const found = scrollToRenderedHash("#order", { getElementById: vi.fn().mockReturnValue({ scrollIntoView, focus }) } as unknown as Document);
    expect(found).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("re-runs rendered hash scrolling for browser hash and history navigation", () => {
    const listeners = new Map<string, EventListener>();
    const scrollIntoView = vi.fn();
    const focus = vi.fn();
    const windowRef = {
      location: { hash: "#order" },
      requestAnimationFrame: (callback: FrameRequestCallback) => { callback(0); return 1; },
      setTimeout: vi.fn(), clearTimeout: vi.fn(),
      addEventListener: (name: string, listener: EventListener) => listeners.set(name, listener),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const documentRef = { getElementById: vi.fn().mockReturnValue({ scrollIntoView, focus }), addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as Document;
    const cleanup = installRenderedHashScrolling(windowRef, documentRef);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    listeners.get("hashchange")?.(new Event("hashchange"));
    listeners.get("popstate")?.(new Event("popstate"));
    expect(scrollIntoView).toHaveBeenCalledTimes(3);
    cleanup();
  });
});
