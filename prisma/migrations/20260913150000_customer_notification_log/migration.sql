-- CreateEnum
CREATE TYPE "notification_type" AS ENUM (
  'customer_order_received',
  'customer_dispatched',
  'customer_delivered',
  'customer_cancelled',
  'customer_refunded'
);

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "notification_logs" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "type" "notification_type" NOT NULL,
  "status" "notification_status" NOT NULL DEFAULT 'pending',
  "recipient" TEXT NOT NULL,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_logs_order_id_type_key"
ON "notification_logs"("order_id", "type");

-- CreateIndex
CREATE INDEX "notification_logs_status_created_at_idx"
ON "notification_logs"("status", "created_at");

-- AddForeignKey
ALTER TABLE "notification_logs"
ADD CONSTRAINT "notification_logs_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
