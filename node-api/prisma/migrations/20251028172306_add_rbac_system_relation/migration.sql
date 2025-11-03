/*
  Warnings:

  - Added the required column `systemId` to the `rbac_rules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."rbac_rules" ADD COLUMN     "systemId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "rbac_rules_systemId_idx" ON "public"."rbac_rules"("systemId");

-- AddForeignKey
ALTER TABLE "public"."rbac_rules" ADD CONSTRAINT "rbac_rules_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
