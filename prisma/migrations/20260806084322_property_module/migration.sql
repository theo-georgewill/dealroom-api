/*
  Warnings:

  - You are about to drop the column `dealId` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Property` table. All the data in the column will be lost.
  - Added the required column `ownerId` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_dealId_fkey";

-- DropIndex
DROP INDEX "Property_dealId_key";

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "propertyId" TEXT;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "dealId",
DROP COLUMN "images",
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "storageFileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyImage_storageFileId_key" ON "PropertyImage"("storageFileId");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");

-- CreateIndex
CREATE INDEX "Deal_propertyId_idx" ON "Deal"("propertyId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_storageFileId_fkey" FOREIGN KEY ("storageFileId") REFERENCES "StorageFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
