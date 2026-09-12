import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server/app";

const RUN_DATABASE_TESTS = process.env.RUN_DATABASE_TESTS === "true";
const databaseDescribe = RUN_DATABASE_TESTS ? describe : describe.skip;
const TEST_NAME_PREFIX = "[DEV TEST] Business API";
const TEST_SLUG_PREFIX = "dev-api-test-";
const runId = `${Date.now()}-${process.pid}`;
const prisma = new PrismaClient();

let app: Awaited<ReturnType<typeof createApp>>;
let activeProductSlug: string;
let inactiveProductSlug: string;
let noActiveVariantsSlug: string;
let firstVariantId: string;
let secondVariantId: string;
let inactiveVariantId: string;
let inactiveProductVariantId: string;

async function cleanTestTransactions() {
  const testCustomers = await prisma.customer.findMany({
    where: { name: { startsWith: TEST_NAME_PREFIX } },
    select: { id: true },
  });
  const testOrders = await prisma.order.findMany({
    where: {
      OR: [
        { customerId: { in: testCustomers.map((customer) => customer.id) } },
        {
          items: {
            some: { productNameSnapshot: { startsWith: TEST_NAME_PREFIX } },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (testOrders.length > 0) {
    await prisma.order.deleteMany({
      where: { id: { in: testOrders.map((order) => order.id) } },
    });
  }

  await prisma.customer.deleteMany({
    where: { id: { in: testCustomers.map((customer) => customer.id) } },
  });
}

async function cleanAllTestData() {
  await cleanTestTransactions();
  await prisma.product.deleteMany({
    where: { slug: { startsWith: TEST_SLUG_PREFIX } },
  });
}

function orderRequest(
  phone: string,
  items: Array<{ variantId: string; quantity: number }>,
) {
  return {
    customer: {
      name: `${TEST_NAME_PREFIX} Customer ${phone}`,
      phone,
      email: "api-test@example.com",
    },
    deliveryLocation: "Nairobi API test location",
    customerNote: "Development database integration test",
    items,
  };
}

databaseDescribe("Business API against PostgreSQL", () => {
  beforeAll(async () => {
    await cleanAllTestData();
    app = await createApp({ serveFrontend: false, resendApiKey: "" });

    const activeProduct = await prisma.product.create({
      data: {
        name: `${TEST_NAME_PREFIX} Active Honey ${runId}`,
        slug: `${TEST_SLUG_PREFIX}active-${runId}`,
        description: "Clearly identified temporary development API test product.",
        active: true,
        variants: {
          create: [
            {
              name: "Development 250 g",
              sku: `DEV-250-${runId}`,
              unitPriceMinor: 65_000,
              currency: "KES",
              stockQuantity: 10,
              active: true,
            },
            {
              name: "Development 500 g",
              sku: `DEV-500-${runId}`,
              unitPriceMinor: 110_000,
              currency: "KES",
              stockQuantity: 10,
              active: true,
            },
            {
              name: "Development inactive jar",
              sku: `DEV-INACTIVE-${runId}`,
              unitPriceMinor: 1,
              currency: "KES",
              stockQuantity: 10,
              active: false,
            },
          ],
        },
      },
      include: { variants: true },
    });

    const inactiveProduct = await prisma.product.create({
      data: {
        name: `${TEST_NAME_PREFIX} Inactive Product ${runId}`,
        slug: `${TEST_SLUG_PREFIX}inactive-${runId}`,
        active: false,
        variants: {
          create: {
            name: "Development active variant on inactive product",
            sku: `DEV-INACTIVE-PRODUCT-${runId}`,
            unitPriceMinor: 50_000,
            stockQuantity: 10,
            active: true,
          },
        },
      },
      include: { variants: true },
    });

    const noActiveVariantsProduct = await prisma.product.create({
      data: {
        name: `${TEST_NAME_PREFIX} No Active Variants ${runId}`,
        slug: `${TEST_SLUG_PREFIX}no-active-variants-${runId}`,
        active: true,
        variants: {
          create: {
            name: "Development inactive-only variant",
            sku: `DEV-NO-ACTIVE-${runId}`,
            unitPriceMinor: 50_000,
            stockQuantity: 10,
            active: false,
          },
        },
      },
    });

    activeProductSlug = activeProduct.slug;
    inactiveProductSlug = inactiveProduct.slug;
    inactiveProductVariantId = inactiveProduct.variants[0].id;
    noActiveVariantsSlug = noActiveVariantsProduct.slug;
    firstVariantId = activeProduct.variants.find((variant) => variant.sku.startsWith("DEV-250-"))!.id;
    secondVariantId = activeProduct.variants.find((variant) => variant.sku.startsWith("DEV-500-"))!.id;
    inactiveVariantId = activeProduct.variants.find((variant) => variant.sku.startsWith("DEV-INACTIVE-"))!.id;
  }, 30_000);

  beforeEach(async () => {
    await cleanTestTransactions();
    await prisma.productVariant.update({
      where: { id: firstVariantId },
      data: { stockQuantity: 10, active: true },
    });
    await prisma.productVariant.update({
      where: { id: secondVariantId },
      data: { stockQuantity: 10, active: true },
    });
    await prisma.productVariant.update({
      where: { id: inactiveVariantId },
      data: { stockQuantity: 10, active: false },
    });
  });

  afterAll(async () => {
    await cleanAllTestData();
    await prisma.$disconnect();
  }, 30_000);

  it("returns active products and excludes inactive or empty catalogue products", async () => {
    const response = await request(app).get("/api/products");

    expect(response.status).toBe(200);
    const slugs = response.body.products.map((product: { slug: string }) => product.slug);
    expect(slugs).toContain(activeProductSlug);
    expect(slugs).not.toContain(inactiveProductSlug);
    expect(slugs).not.toContain(noActiveVariantsSlug);
  });

  it("returns only active variants and only public catalogue fields", async () => {
    const response = await request(app).get(`/api/products/${activeProductSlug}`);

    expect(response.status).toBe(200);
    expect(response.body.product.variants).toHaveLength(2);
    expect(response.body.product.variants.map((variant: { id: string }) => variant.id))
      .not.toContain(inactiveVariantId);
    expect(Object.keys(response.body.product).sort())
      .toEqual(["description", "name", "slug", "variants"]);
    expect(Object.keys(response.body.product.variants[0]).sort())
      .toEqual(["availableStock", "currency", "id", "name", "priceMinor", "sku"]);
  });

  it("returns 404 for an invalid product slug", async () => {
    const response = await request(app).get("/api/products/not-a-real-development-product");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Product not found." });
  });

  it("creates a valid order with normalized phone, server totals and snapshots", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send(orderRequest("0710 000 001", [{ variantId: firstVariantId, quantity: 2 }]));

    expect(response.status).toBe(201);
    expect(response.body.order).toMatchObject({
      status: "new",
      paymentStatus: "pending",
      deliveryStatus: "pending",
      currency: "KES",
      subtotalMinor: 130_000,
      deliveryFeeMinor: 0,
      totalAmountMinor: 130_000,
      customer: { phone: "+254710000001" },
    });
    expect(response.body.order.orderReference).toMatch(/^ASILI-\d{6}-[A-F0-9]{6}$/);

    const storedOrder = await prisma.order.findUnique({
      where: { orderNumber: response.body.order.orderReference },
      include: { items: true, customer: true },
    });
    expect(storedOrder?.items[0]).toMatchObject({
      productNameSnapshot: `${TEST_NAME_PREFIX} Active Honey ${runId}`,
      variantNameSnapshot: "Development 250 g",
      unitPriceMinor: 65_000,
      quantity: 2,
      lineTotalMinor: 130_000,
    });
    expect(storedOrder?.customer.normalizedPhone).toBe("+254710000001");
    expect(await prisma.productVariant.findUnique({ where: { id: firstVariantId } }))
      .toMatchObject({ stockQuantity: 8 });
  });

  it("rejects an inactive variant", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send(orderRequest("0710000002", [{ variantId: inactiveVariantId, quantity: 1 }]));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("PRODUCT_UNAVAILABLE");
  });

  it("rejects an active variant whose product is inactive", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send(orderRequest("0710000010", [{ variantId: inactiveProductVariantId, quantity: 1 }]));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("PRODUCT_UNAVAILABLE");
  });

  it.each([0, -1])("rejects quantity %s", async (quantity) => {
    const response = await request(app)
      .post("/api/orders")
      .send(orderRequest("0710000003", [{ variantId: firstVariantId, quantity }]));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_ORDER");
  });

  it("rejects insufficient stock", async () => {
    await prisma.productVariant.update({
      where: { id: firstVariantId },
      data: { stockQuantity: 1 },
    });
    const response = await request(app)
      .post("/api/orders")
      .send(orderRequest("0710000004", [{ variantId: firstVariantId, quantity: 2 }]));

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("INSUFFICIENT_STOCK");
    expect(await prisma.productVariant.findUnique({ where: { id: firstVariantId } }))
      .toMatchObject({ stockQuantity: 1 });
  });

  it("creates a multi-item order with server-calculated totals and decrements", async () => {
    const response = await request(app).post("/api/orders").send(orderRequest("0710000005", [
      { variantId: firstVariantId, quantity: 2 },
      { variantId: secondVariantId, quantity: 3 },
    ]));

    expect(response.status).toBe(201);
    expect(response.body.order.items).toHaveLength(2);
    expect(response.body.order.totalAmountMinor).toBe(460_000);
    const stocks = await prisma.productVariant.findMany({
      where: { id: { in: [firstVariantId, secondVariantId] } },
      orderBy: { id: "asc" },
      select: { id: true, stockQuantity: true },
    });
    expect(new Map(stocks.map((variant) => [variant.id, variant.stockQuantity]))).toEqual(
      new Map([[firstVariantId, 8], [secondVariantId, 7]]),
    );
  });

  it("rolls back all stock changes when one line cannot be fulfilled", async () => {
    await prisma.productVariant.update({
      where: { id: firstVariantId },
      data: { stockQuantity: 5 },
    });
    await prisma.productVariant.update({
      where: { id: secondVariantId },
      data: { stockQuantity: 0 },
    });

    const response = await request(app).post("/api/orders").send(orderRequest("0710000006", [
      { variantId: firstVariantId, quantity: 1 },
      { variantId: secondVariantId, quantity: 1 },
    ]));

    expect(response.status).toBe(409);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: [firstVariantId, secondVariantId] } },
      select: { id: true, stockQuantity: true },
    });
    expect(new Map(variants.map((variant) => [variant.id, variant.stockQuantity]))).toEqual(
      new Map([[firstVariantId, 5], [secondVariantId, 0]]),
    );
  });

  it("reuses a customer across equivalent Kenyan phone formats", async () => {
    const first = await request(app)
      .post("/api/orders")
      .send(orderRequest("0710000007", [{ variantId: firstVariantId, quantity: 1 }]));
    const second = await request(app)
      .post("/api/orders")
      .send(orderRequest("+254710000007", [{ variantId: firstVariantId, quantity: 1 }]));

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await prisma.customer.count({
      where: { normalizedPhone: "+254710000007" },
    })).toBe(1);
  });

  it("allows only one of two concurrent orders for the final stock unit", async () => {
    await prisma.productVariant.update({
      where: { id: firstVariantId },
      data: { stockQuantity: 1 },
    });

    const responses = await Promise.all([
      request(app).post("/api/orders")
        .send(orderRequest("0710000008", [{ variantId: firstVariantId, quantity: 1 }])),
      request(app).post("/api/orders")
        .send(orderRequest("0710000009", [{ variantId: firstVariantId, quantity: 1 }])),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await prisma.productVariant.findUnique({ where: { id: firstVariantId } }))
      .toMatchObject({ stockQuantity: 0 });
    expect(await prisma.order.count({
      where: {
        items: { some: { productNameSnapshot: { startsWith: TEST_NAME_PREFIX } } },
      },
    })).toBe(1);
  });
});
