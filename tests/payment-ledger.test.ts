import { PaymentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculatePaymentBalance, derivePaymentStatus } from "../src/server/services/admin";

describe("payment ledger totals", () => {
  it("counts only auditable paid receipts and preserves legacy rows without fabricating revenue", () => {
    expect(calculatePaymentBalance(120000, [
      { amountMinor: 120000, status: PaymentStatus.PARTIALLY_PAID },
      { amountMinor: 30000, status: PaymentStatus.PAID },
      { amountMinor: 10000, status: PaymentStatus.PENDING },
    ])).toEqual({ amountDueMinor: 120000, amountReceivedMinor: 30000, balanceMinor: 90000 });
  });

  it("supports multiple receipts without allowing a negative displayed balance", () => {
    expect(calculatePaymentBalance(60000, [
      { amountMinor: 20000, status: PaymentStatus.PAID },
      { amountMinor: 40000, status: PaymentStatus.PAID },
    ])).toEqual({ amountDueMinor: 60000, amountReceivedMinor: 60000, balanceMinor: 0 });
  });

  it("derives pending, partial and paid states from receipts", () => {
    expect(derivePaymentStatus(180000, [])).toBe(PaymentStatus.PENDING);
    expect(derivePaymentStatus(180000, [{ amountMinor: 80000, status: PaymentStatus.PAID }])).toBe(PaymentStatus.PARTIALLY_PAID);
    expect(derivePaymentStatus(180000, [{ amountMinor: 80000, status: PaymentStatus.PAID }, { amountMinor: 100000, status: PaymentStatus.PAID }])).toBe(PaymentStatus.PAID);
  });
});
