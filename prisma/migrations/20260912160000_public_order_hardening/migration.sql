-- Unknown stock is represented by NULL. Known stock remains a non-negative integer.
ALTER TABLE "product_variants"
ALTER COLUMN "stock_quantity" DROP NOT NULL,
ALTER COLUMN "stock_quantity" DROP DEFAULT;

-- Nullable columns preserve all existing orders while enabling replay-safe public submissions.
ALTER TABLE "orders"
ADD COLUMN "idempotency_key" TEXT,
ADD COLUMN "idempotency_fingerprint" TEXT;

CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");
