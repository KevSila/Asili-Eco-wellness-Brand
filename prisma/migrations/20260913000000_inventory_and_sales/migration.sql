-- Add sales-channel and inventory audit enums without replacing existing enums.
CREATE TYPE "order_source" AS ENUM ('website', 'manual', 'whatsapp', 'phone', 'walk_in');
CREATE TYPE "inventory_movement_type" AS ENUM ('opening_stock', 'stock_received', 'online_sale', 'manual_sale', 'damage', 'correction', 'return', 'stock_unconfirmed');
CREATE TYPE "inventory_movement_source" AS ENUM ('admin', 'website_order', 'manual_sale');

-- Existing orders remain website orders. Nullable customer/location fields support
-- anonymous and collection-based offline sales without changing existing values.
ALTER TABLE "customers"
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "normalized_phone" DROP NOT NULL;

ALTER TABLE "orders"
ALTER COLUMN "customer_id" DROP NOT NULL,
ALTER COLUMN "delivery_area" DROP NOT NULL,
ADD COLUMN "source" "order_source" NOT NULL DEFAULT 'website',
ADD COLUMN "customer_name_snapshot" TEXT,
ADD COLUMN "customer_phone_snapshot" TEXT;

-- Inventory history is append-only at the application boundary. Variant deletion
-- is restricted; an order deletion preserves history and clears only the order link.
CREATE TABLE "inventory_movements" (
  "id" TEXT NOT NULL,
  "product_variant_id" TEXT NOT NULL,
  "order_id" TEXT,
  "type" "inventory_movement_type" NOT NULL,
  "quantity_delta" INTEGER,
  "stock_before" INTEGER,
  "stock_after" INTEGER,
  "reason" TEXT NOT NULL,
  "source" "inventory_movement_source" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_movements_stock_before_nonnegative" CHECK ("stock_before" IS NULL OR "stock_before" >= 0),
  CONSTRAINT "inventory_movements_stock_after_nonnegative" CHECK ("stock_after" IS NULL OR "stock_after" >= 0)
);

CREATE INDEX "orders_source_created_at_idx" ON "orders"("source", "created_at");
CREATE INDEX "inventory_movements_product_variant_id_created_at_idx" ON "inventory_movements"("product_variant_id", "created_at");
CREATE INDEX "inventory_movements_order_id_idx" ON "inventory_movements"("order_id");
CREATE INDEX "inventory_movements_type_created_at_idx" ON "inventory_movements"("type", "created_at");

ALTER TABLE "inventory_movements"
ADD CONSTRAINT "inventory_movements_product_variant_id_fkey"
FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_movements"
ADD CONSTRAINT "inventory_movements_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
