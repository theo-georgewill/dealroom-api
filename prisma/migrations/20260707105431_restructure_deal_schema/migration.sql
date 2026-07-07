/*
  Warnings:

  - You are about to drop the column `closingDate` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `dealValue` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `propertyAddress` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `propertyType` on the `Deal` table. All the data in the column will be lost.
  - The `currency` column on the `EscrowTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `currency` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `currency` column on the `Transfer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `fundingSource` to the `Escrow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `holdingPeriod` to the `Escrow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `WebhookEvent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'LAND', 'MIXED_USE');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('PURCHASE', 'LEASE', 'SALE', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "FundingSource" AS ENUM ('BUYER_DEPOSIT', 'SPLIT_DEPOSIT', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "PaymentStructure" AS ENUM ('SINGLE_PAYMENT', 'MILESTONE_PAYMENTS', 'CUSTOM_STRUCTURE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('NGN', 'USD', 'GBP', 'EUR');

-- AlterTable
ALTER TABLE "Deal" DROP COLUMN "closingDate",
DROP COLUMN "currency",
DROP COLUMN "dealValue",
DROP COLUMN "description",
DROP COLUMN "propertyAddress",
DROP COLUMN "propertyType";

-- AlterTable
ALTER TABLE "Escrow" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN',
ADD COLUMN     "fundingSource" "FundingSource" NOT NULL,
ADD COLUMN     "holdingPeriod" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "EscrowTransaction" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE "WebhookEvent" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "description" TEXT,
    "images" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealTerms" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "dealType" "DealType" NOT NULL,
    "currency" "Currency" NOT NULL,
    "dealValue" DECIMAL(15,2) NOT NULL,
    "earnestMoney" DECIMAL(15,2),
    "closingDate" TIMESTAMP(3) NOT NULL,
    "longStopDate" TIMESTAMP(3),
    "paymentStructure" "PaymentStructure" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealTerms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowReleaseCondition" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowReleaseCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_dealId_key" ON "Property"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "DealTerms_dealId_key" ON "DealTerms"("dealId");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTerms" ADD CONSTRAINT "DealTerms_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowReleaseCondition" ADD CONSTRAINT "EscrowReleaseCondition_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
