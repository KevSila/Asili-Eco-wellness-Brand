import { describe, expect, it } from "vitest";
import { resolveHistoricalOrderCustomer } from "../src/server/lib/order-customer-snapshot";

describe("historical order customer identity", () => {
  it("keeps each order snapshot while one canonical CRM customer changes", () => {
    const canonicalCustomer = { normalizedPhone: "+254710000014", name: "Sila" };
    const firstOrder = resolveHistoricalOrderCustomer({ customerNameSnapshot: "DEV PREVIEW TEST", customerPhoneSnapshot: canonicalCustomer.normalizedPhone, currentName: canonicalCustomer.name, currentPhone: canonicalCustomer.normalizedPhone });
    const secondOrder = resolveHistoricalOrderCustomer({ customerNameSnapshot: "Sila", customerPhoneSnapshot: canonicalCustomer.normalizedPhone, currentName: canonicalCustomer.name, currentPhone: canonicalCustomer.normalizedPhone });
    expect(firstOrder).toEqual({ name: "DEV PREVIEW TEST", phone: "+254710000014" });
    expect(secondOrder).toEqual({ name: "Sila", phone: "+254710000014" });
    expect(new Set([canonicalCustomer.normalizedPhone]).size).toBe(1);
  });
});
