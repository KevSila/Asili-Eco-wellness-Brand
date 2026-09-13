import { OrderSource, PaymentStatus } from "@prisma/client";

export const SALES_TIME_ZONE = "Africa/Nairobi";
const NAIROBI_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

export interface ReportingOrder {
  createdAt: Date;
  source: OrderSource;
  paymentStatus: PaymentStatus;
  subtotalMinor: number;
  items: Array<{
    productNameSnapshot: string;
    variantNameSnapshot: string;
    skuSnapshot: string | null;
    quantity: number;
  }>;
}

export interface SalesPeriodSummary {
  productSalesMinor: number;
  paidRevenueMinor: number;
  awaitingPaymentMinor: number;
  unitsOrdered: number;
}

export function getNairobiPeriodStarts(now = new Date()) {
  const nairobi = new Date(now.getTime() + NAIROBI_UTC_OFFSET_MS);
  const year = nairobi.getUTCFullYear();
  const month = nairobi.getUTCMonth();
  const day = nairobi.getUTCDate();
  const localMidnightAsUtc = Date.UTC(year, month, day);
  const mondayOffset = (new Date(localMidnightAsUtc).getUTCDay() + 6) % 7;
  const toActualUtc = (localTimestamp: number) => new Date(localTimestamp - NAIROBI_UTC_OFFSET_MS);

  return {
    today: toActualUtc(localMidnightAsUtc),
    week: toActualUtc(Date.UTC(year, month, day - mondayOffset)),
    month: toActualUtc(Date.UTC(year, month, 1)),
  };
}

function summarizePeriod(orders: ReportingOrder[], start: Date): SalesPeriodSummary {
  return orders.filter((order) => order.createdAt >= start).reduce<SalesPeriodSummary>((summary, order) => {
    summary.productSalesMinor += order.subtotalMinor;
    summary.unitsOrdered += order.items.reduce((total, item) => total + item.quantity, 0);
    if (order.paymentStatus === PaymentStatus.PAID) summary.paidRevenueMinor += order.subtotalMinor;
    else summary.awaitingPaymentMinor += order.subtotalMinor;
    return summary;
  }, { productSalesMinor: 0, paidRevenueMinor: 0, awaitingPaymentMinor: 0, unitsOrdered: 0 });
}

export function buildSalesSummary(orders: ReportingOrder[], now = new Date()) {
  const starts = getNairobiPeriodStarts(now);
  const monthOrders = orders.filter((order) => order.createdAt >= starts.month);
  const variantMap = new Map<string, { productName: string; variantName: string; sku: string | null; unitsOrdered: number; paidUnits: number }>();

  for (const order of monthOrders) {
    for (const item of order.items) {
      const key = item.skuSnapshot ?? `${item.productNameSnapshot}\u0000${item.variantNameSnapshot}`;
      const current = variantMap.get(key) ?? { productName: item.productNameSnapshot, variantName: item.variantNameSnapshot, sku: item.skuSnapshot, unitsOrdered: 0, paidUnits: 0 };
      current.unitsOrdered += item.quantity;
      if (order.paymentStatus === PaymentStatus.PAID) current.paidUnits += item.quantity;
      variantMap.set(key, current);
    }
  }

  const sources = [OrderSource.WEBSITE, OrderSource.MANUAL, OrderSource.WHATSAPP, OrderSource.PHONE, OrderSource.WALK_IN];
  return {
    timeZone: SALES_TIME_ZONE,
    periodStarts: Object.fromEntries(Object.entries(starts).map(([key, value]) => [key, value.toISOString()])),
    periods: {
      today: summarizePeriod(orders, starts.today),
      week: summarizePeriod(orders, starts.week),
      month: summarizePeriod(monthOrders, starts.month),
    },
    unitsByVariant: [...variantMap.values()].sort((a, b) => b.unitsOrdered - a.unitsOrdered || a.variantName.localeCompare(b.variantName)),
    revenueBySource: sources.map((source) => {
      const sourceOrders = monthOrders.filter((order) => order.source === source);
      const totals = summarizePeriod(sourceOrders, starts.month);
      return { source: source.toLowerCase(), ...totals };
    }),
  };
}
