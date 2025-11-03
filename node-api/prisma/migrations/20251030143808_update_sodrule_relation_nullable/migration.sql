-- DropIndex
DROP INDEX "public"."sod_rules_userId_systemId_valueAType_valueAId_valueAOperato_key";

-- AlterTable
ALTER TABLE "public"."sod_rules" ALTER COLUMN "systemId" DROP NOT NULL;
