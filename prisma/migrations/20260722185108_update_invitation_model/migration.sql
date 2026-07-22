/*
  Warnings:

  - A unique constraint covering the columns `[dealId,email]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'CANCELLED';

-- DropIndex
DROP INDEX "Invitation_email_idx";

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "declinedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Invitation_dealId_email_idx" ON "Invitation"("dealId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_dealId_email_key" ON "Invitation"("dealId", "email");
