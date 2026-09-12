import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (transaction) => {
    const product = await transaction.product.upsert({
      where: { slug: "asili-raw-makueni-honey-sample" },
      update: {
        name: "Asili Raw Makueni Honey (Sample)",
        description: "Inactive sample catalogue record. Confirm real sizes, prices and availability before publishing.",
        active: false,
      },
      create: {
        name: "Asili Raw Makueni Honey (Sample)",
        slug: "asili-raw-makueni-honey-sample",
        description: "Inactive sample catalogue record. Confirm real sizes, prices and availability before publishing.",
        active: false,
      },
    });

    await transaction.productVariant.upsert({
      where: { sku: "ASILI-HONEY-SAMPLE" },
      update: {
        productId: product.id,
        name: "Sample jar",
        unitPriceMinor: 0,
        currency: "KES",
        stockQuantity: 0,
        active: false,
      },
      create: {
        productId: product.id,
        name: "Sample jar",
        sku: "ASILI-HONEY-SAMPLE",
        unitPriceMinor: 0,
        currency: "KES",
        stockQuantity: 0,
        active: false,
      },
    });

    const realHoney = await transaction.product.upsert({
      where: { slug: "asili-raw-makueni-honey" },
      update: {
        name: "Asili Raw Makueni Honey",
        description: "Asili honey from Makueni, available in 500g and 1kg jars.",
        active: true,
      },
      create: {
        name: "Asili Raw Makueni Honey",
        slug: "asili-raw-makueni-honey",
        description: "Asili honey from Makueni, available in 500g and 1kg jars.",
        active: true,
      },
    });

    for (const variant of [
      { name: "500g", sku: "ASILI-HONEY-500G", unitPriceMinor: 60_000 },
      { name: "1kg", sku: "ASILI-HONEY-1KG", unitPriceMinor: 120_000 },
    ]) {
      await transaction.productVariant.upsert({
        where: { sku: variant.sku },
        update: {
          productId: realHoney.id,
          name: variant.name,
          unitPriceMinor: variant.unitPriceMinor,
          currency: "KES",
          active: true,
        },
        create: {
          productId: realHoney.id,
          ...variant,
          currency: "KES",
          stockQuantity: null,
          active: true,
        },
      });
    }
  });

  console.log("Seeded the inactive sample and real Asili honey catalogue records.");
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
