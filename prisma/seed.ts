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
  });

  console.log("Seeded the inactive Asili sample product and variant.");
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
