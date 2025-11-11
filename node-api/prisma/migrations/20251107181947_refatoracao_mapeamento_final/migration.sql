/*
  Warnings:

  - You are about to drop the column `map_cpf_hr` on the `data_mappings_hr` table. All the data in the column will be lost.
  - You are about to drop the column `map_email_hr` on the `data_mappings_hr` table. All the data in the column will be lost.
  - You are about to drop the column `map_extra_data_hr` on the `data_mappings_hr` table. All the data in the column will be lost.
  - You are about to drop the column `map_identity_id_hr` on the `data_mappings_hr` table. All the data in the column will be lost.
  - You are about to drop the column `map_name_hr` on the `data_mappings_hr` table. All the data in the column will be lost.
  - You are about to drop the column `map_status_hr` on the `data_mappings_hr` table. All the data in the column will be lost.
  - You are about to drop the column `map_user_type_hr` on the `data_mappings_hr` table. All the data in the column will be lost.
  - You are about to drop the column `map_email_idm` on the `data_mappings_idm` table. All the data in the column will be lost.
  - You are about to drop the column `map_extra_data_idm` on the `data_mappings_idm` table. All the data in the column will be lost.
  - You are about to drop the column `map_identity_id_idm` on the `data_mappings_idm` table. All the data in the column will be lost.
  - You are about to drop the column `map_name_idm` on the `data_mappings_idm` table. All the data in the column will be lost.
  - You are about to drop the column `map_status_idm` on the `data_mappings_idm` table. All the data in the column will be lost.
  - You are about to drop the column `map_email_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_extra_data_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_id_in_system_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_name_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_status_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `map_user_type_account` on the `data_mappings_system` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."data_mappings_hr" DROP COLUMN "map_cpf_hr",
DROP COLUMN "map_email_hr",
DROP COLUMN "map_extra_data_hr",
DROP COLUMN "map_identity_id_hr",
DROP COLUMN "map_name_hr",
DROP COLUMN "map_status_hr",
DROP COLUMN "map_user_type_hr",
ADD COLUMN     "cpf_hr" TEXT,
ADD COLUMN     "email_hr" TEXT,
ADD COLUMN     "extra_data_hr" TEXT,
ADD COLUMN     "identity_id_hr" TEXT,
ADD COLUMN     "name_hr" TEXT,
ADD COLUMN     "status_hr" TEXT,
ADD COLUMN     "user_type_hr" TEXT;

-- AlterTable
ALTER TABLE "public"."data_mappings_idm" DROP COLUMN "map_email_idm",
DROP COLUMN "map_extra_data_idm",
DROP COLUMN "map_identity_id_idm",
DROP COLUMN "map_name_idm",
DROP COLUMN "map_status_idm",
ADD COLUMN     "email_idm" TEXT,
ADD COLUMN     "extra_data_idm" TEXT,
ADD COLUMN     "identity_id_idm" TEXT,
ADD COLUMN     "name_idm" TEXT,
ADD COLUMN     "status_idm" TEXT;

-- AlterTable
ALTER TABLE "public"."data_mappings_system" DROP COLUMN "map_email_account",
DROP COLUMN "map_extra_data_account",
DROP COLUMN "map_id_in_system_account",
DROP COLUMN "map_name_account",
DROP COLUMN "map_status_account",
DROP COLUMN "map_user_type_account",
ADD COLUMN     "email_account" TEXT,
ADD COLUMN     "extra_data_account" TEXT,
ADD COLUMN     "id_in_system_account" TEXT,
ADD COLUMN     "name_account" TEXT,
ADD COLUMN     "status_account" TEXT,
ADD COLUMN     "user_type_account" TEXT;
