/*
  Warnings:

  - You are about to drop the column `paymentReference` on the `Escrow` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `Escrow` table. All the data in the column will be lost.
  - You are about to drop the column `providerReference` on the `Escrow` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `EscrowTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ledgerReference]` on the table `EscrowTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ledgerReference` to the `EscrowTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EscrowTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payload` to the `WebhookEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `WebhookEvent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('NOMBA');

-- AlterEnum
ALTER TYPE "DealStatus" ADD VALUE 'DISPUTED';

-- AlterEnum
ALTER TYPE "EscrowStatus" ADD VALUE 'RELEASING';

-- DropIndex
DROP INDEX "Escrow_paymentReference_key";

-- DropIndex
DROP INDEX "EscrowTransaction_reference_key";

-- AlterTable
ALTER TABLE "Escrow" DROP COLUMN "paymentReference",
DROP COLUMN "provider",
DROP COLUMN "providerReference";

-- AlterTable
ALTER TABLE "EscrowTransaction" DROP COLUMN "reference",
ADD COLUMN     "ledgerReference" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "WebhookEvent" ADD COLUMN     "payload" JSONB NOT NULL,
ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "signature" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "merchantTxRef" TEXT NOT NULL,
    "checkoutReference" TEXT,
    "providerReference" TEXT,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'NOMBA',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "merchantTxRef" TEXT NOT NULL,
    "providerReference" TEXT,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_merchantTxRef_key" ON "Payment"("merchantTxRef");

-- CreateIndex
CREATE INDEX "Payment_merchantTxRef_idx" ON "Payment"("merchantTxRef");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_merchantTxRef_key" ON "Transfer"("merchantTxRef");

-- CreateIndex
CREATE INDEX "Transfer_merchantTxRef_idx" ON "Transfer"("merchantTxRef");

-- CreateIndex
CREATE INDEX "Transfer_status_idx" ON "Transfer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransaction_ledgerReference_key" ON "EscrowTransaction"("ledgerReference");

-- CreateIndex
CREATE INDEX "EscrowTransaction_escrowId_idx" ON "EscrowTransaction"("escrowId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_status_idx" ON "EscrowTransaction"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
