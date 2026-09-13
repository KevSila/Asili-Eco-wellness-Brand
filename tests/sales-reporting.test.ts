import { OrderSource, PaymentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildSalesSummary, getNairobiPeriodStarts, type ReportingOrder } from "../src/server/services/sales-reporting";

function order(input: Partial<ReportingOrder> & Pick<ReportingOrder, "createdAt" | "source" | "paymentStatus" | "subtotalMinor">): ReportingOrder {
  return {
    ...input,
    items: input.items ?? [{ productNameSnapshot: "Asili Raw Makueni Honey", variantNameSnapshot: "500g", skuSnapshot: "ASILI-HONEY-500G", quantity: 1 }],
  };
}

describe("Nairobi sales reporting", () => {
  it("uses Nairobi midnight and Monday as business period boundaries", () => {
    const starts = getNairobiPeriodStarts(new Date("2026-09-13T21:30:00.000Z"));
    expect(starts.today.toISOString()).toBe("2026-09-13T21:00:00.000Z");
    expect(starts.week.toISOString()).toBe("2026-09-13T21:00:00.000Z");
    expect(starts.month.toISOString()).toBe("2026-08-31T21:00:00.000Z");
  });

  it("separates booked product sales, paid revenue and awaiting-payment value", () => {
    const now = new Date("2026-09-16T09:00:00.000Z");
    const summary = buildSalesSummary([
      order({ createdAt: new Date("2026-09-16T06:00:00.000Z"), source: OrderSource.WEBSITE, paymentStatus: PaymentStatus.PENDING, subtotalMinor: 60_000 }),
      order({ createdAt: new Date("2026-09-15T06:00:00.000Z"), source: OrderSource.WALK_IN, paymentStatus: PaymentStatus.PAID, subtotalMinor: 120_000, items: [{ productNameSnapshot: "Asili Raw Makueni Honey", variantNameSnapshot: "1kg", skuSnapshot: "ASILI-HONEY-1KG", quantity: 2 }] }),
      order({ createdAt: new Date("2026-09-05T06:00:00.000Z"), source: OrderSource.PHONE, paymentStatus: PaymentStatus.PARTIALLY_PAID, subtotalMinor: 60_000 }),
    ], now);

    expect(summary.periods.today).toEqual({ productSalesMinor: 60_000, paidRevenueMinor: 0, awaitingPaymentMinor: 60_000, unitsOrdered: 1 });
    expect(summary.periods.week).toEqual({ productSalesMinor: 180_000, paidRevenueMinor: 120_000, awaitingPaymentMinor: 60_000, unitsOrdered: 3 });
    expect(summary.periods.month).toEqual({ productSalesMinor: 240_000, paidRevenueMinor: 120_000, awaitingPaymentMinor: 120_000, unitsOrdered: 4 });
    expect(summary.unitsByVariant).toEqual(expect.arrayContaining([
      expect.objectContaining({ variantName: "500g", unitsOrdered: 2, paidUnits: 0 }),
      expect.objectContaining({ variantName: "1kg", unitsOrdered: 2, paidUnits: 2 }),
    ]));
    expect(summary.revenueBySource.find((source) => source.source === "walk_in")).toMatchObject({ paidRevenueMinor: 120_000, awaitingPaymentMinor: 0, unitsOrdered: 2 });
    expect(summary.revenueBySource.find((source) => source.source === "website")).toMatchObject({ paidRevenueMinor: 0, awaitingPaymentMinor: 60_000, unitsOrdered: 1 });
  });

  it("does not lose the start of a week that falls in the previous month", () => {
    const summary = buildSalesSummary([
      order({ createdAt: new Date("2026-08-31T08:00:00.000Z"), source: OrderSource.WEBSITE, paymentStatus: PaymentStatus.PAID, subtotalMinor: 60_000 }),
      order({ createdAt: new Date("2026-09-01T08:00:00.000Z"), source: OrderSource.WEBSITE, paymentStatus: PaymentStatus.PENDING, subtotalMinor: 120_000 }),
    ], new Date("2026-09-01T09:00:00.000Z"));

    expect(summary.periods.week.productSalesMinor).toBe(180_000);
    expect(summary.periods.month.productSalesMinor).toBe(120_000);
  });
});
