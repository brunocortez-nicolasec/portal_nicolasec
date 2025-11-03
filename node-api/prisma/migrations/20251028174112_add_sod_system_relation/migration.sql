/*
  Warnings:

  - A unique constraint covering the columns `[userId,systemId,valueAType,valueAId,valueAOperator,valueAValue,valueBType,valueBId]` on the table `sod_rules` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `systemId` to the `sod_rules` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."sod_rules_userId_valueAType_valueAId_valueBType_valueBId_key";

-- AlterTable
ALTER TABLE "public"."sod_rules" ADD COLUMN     "systemId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "sod_rules_systemId_idx" ON "public"."sod_rules"("systemId");

-- CreateIndex
CREATE UNIQUE INDEX "sod_rules_userId_systemId_valueAType_valueAId_valueAOperato_key" ON "public"."sod_rules"("userId", "systemId", "valueAType", "valueAId", "valueAOperator", "valueAValue", "valueBType", "valueBId");

-- AddForeignKey
ALTER TABLE "public"."sod_rules" ADD CONSTRAINT "sod_rules_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
