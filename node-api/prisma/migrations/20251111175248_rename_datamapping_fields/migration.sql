/*
  Warnings:

  - You are about to drop the column `map_accounts_email` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_accounts_id_in_system` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_accounts_identity_id` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_accounts_name` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_accounts_status` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_resources_description` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_resources_id_in_system` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_resources_name` on the `data_mappings_system` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."data_mappings_system" DROP COLUMN "map_accounts_email",
DROP COLUMN "map_accounts_id_in_system",
DROP COLUMN "map_accounts_identity_id",
DROP COLUMN "map_accounts_name",
DROP COLUMN "map_accounts_status",
DROP COLUMN "map_resources_description",
DROP COLUMN "map_resources_id_in_system",
DROP COLUMN "map_resources_name",
ADD COLUMN     "accounts_email" TEXT,
ADD COLUMN     "accounts_id_in_system" TEXT,
ADD COLUMN     "accounts_identity_id" TEXT,
ADD COLUMN     "accounts_name" TEXT,
ADD COLUMN     "accounts_status" TEXT,
ADD COLUMN     "resources_description" TEXT,
ADD COLUMN     "resources_id_in_system" TEXT,
ADD COLUMN     "resources_name" TEXT;
