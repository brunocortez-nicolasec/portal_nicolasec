/*
  Warnings:

  - You are about to drop the column `profileAId` on the `sod_rules` table. All the data in the column will be lost.
  - You are about to drop the column `profileBId` on the `sod_rules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,valueAType,valueAId,valueBType,valueBId]` on the table `sod_rules` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ruleType` to the `sod_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valueAId` to the `sod_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valueAType` to the `sod_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valueBId` to the `sod_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valueBType` to the `sod_rules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."sod_rules" DROP CONSTRAINT "sod_rules_profileAId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sod_rules" DROP CONSTRAINT "sod_rules_profileBId_fkey";

-- DropIndex
DROP INDEX "public"."sod_rules_userId_profileAId_profileBId_key";

-- AlterTable
ALTER TABLE "public"."sod_rules" DROP COLUMN "profileAId",
DROP COLUMN "profileBId",
ADD COLUMN     "areaNegocio" TEXT,
ADD COLUMN     "owner" TEXT,
ADD COLUMN     "processoNegocio" TEXT,
ADD COLUMN     "ruleType" TEXT NOT NULL,
ADD COLUMN     "valueAId" TEXT NOT NULL,
ADD COLUMN     "valueAType" TEXT NOT NULL,
ADD COLUMN     "valueBId" TEXT NOT NULL,
ADD COLUMN     "valueBType" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sod_rules_userId_valueAType_valueAId_valueBType_valueBId_key" ON "public"."sod_rules"("userId", "valueAType", "valueAId", "valueBType", "valueBId");
