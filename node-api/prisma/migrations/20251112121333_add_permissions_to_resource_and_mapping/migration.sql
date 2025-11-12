-- AlterTable
ALTER TABLE "public"."Resource" ADD COLUMN     "permissions" TEXT;

-- AlterTable
ALTER TABLE "public"."data_mappings_system" ADD COLUMN     "resources_permissions" TEXT;
