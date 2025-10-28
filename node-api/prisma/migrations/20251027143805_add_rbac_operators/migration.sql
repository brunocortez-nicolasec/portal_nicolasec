/*
  Warnings:

  - Added the required column `operator` to the `rbac_attribute_conditions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."rbac_attribute_conditions" ADD COLUMN     "operator" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."rbac_rules" ADD COLUMN     "logicalOperator" TEXT,
ADD COLUMN     "requiredAttributeOperator" TEXT;
