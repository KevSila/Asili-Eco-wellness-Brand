import { describe, expect, it, vi } from "vitest";
import { revealOrderConfirmation } from "../src/components/HoneyOrderForm";
import { orderFormHref } from "../src/lib/order-links";
import { publicHoneyFunnel } from "../src/lib/public-funnel";

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
});
