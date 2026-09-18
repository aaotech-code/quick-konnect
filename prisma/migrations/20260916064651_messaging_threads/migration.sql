/*
  Warnings:

  - A unique constraint covering the columns `[customer_id,provider_id]` on the table `message_threads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customer_id` to the `message_threads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider_id` to the `message_threads` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "message_threads_job_id_idx";

-- AlterTable
ALTER TABLE "message_threads" ADD COLUMN     "customer_id" TEXT NOT NULL,
ADD COLUMN     "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "provider_id" TEXT NOT NULL,
ADD COLUMN     "read_by_customer_at" TIMESTAMP(3),
ADD COLUMN     "read_by_provider_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "message_threads_customer_id_last_message_at_idx" ON "message_threads"("customer_id", "last_message_at");

-- CreateIndex
CREATE INDEX "message_threads_provider_id_last_message_at_idx" ON "message_threads"("provider_id", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_customer_id_provider_id_key" ON "message_threads"("customer_id", "provider_id");
