/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Deal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentReference]` on the table `Escrow` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerReference]` on the table `EscrowTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DealParticipant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invitedById` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "reference" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DealParticipant" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Escrow" ADD COLUMN     "paymentReference" TEXT;

-- AlterTable
ALTER TABLE "EscrowTransaction" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "invitedById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_reference_key" ON "Deal"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_paymentReference_key" ON "Escrow"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransaction_providerReference_key" ON "EscrowTransaction"("providerReference");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
