/*
  Warnings:

  - You are about to drop the column `diretorio_accounts` on the `SystemConfig` table. All the data in the column will be lost.
  - You are about to drop the column `diretorio_resources` on the `SystemConfig` table. All the data in the column will be lost.
  - You are about to drop the column `email_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `extra_data_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `id_in_system_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `identity_id_hr` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `name_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `status_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - You are about to drop the column `user_type_account` on the `data_mappings_system` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `System` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_fonte_contas` to the `SystemConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_fonte_recursos` to the `SystemConfig` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SystemConnectionType" AS ENUM ('CSV', 'DATABASE', 'API');

-- AlterTable
ALTER TABLE "public"."System" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description_system" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."SystemConfig" DROP COLUMN "diretorio_accounts",
DROP COLUMN "diretorio_resources",
ADD COLUMN     "diretorio_contas" TEXT,
ADD COLUMN     "diretorio_recursos" TEXT,
ADD COLUMN     "tipo_fonte_contas" "public"."SystemConnectionType" NOT NULL,
ADD COLUMN     "tipo_fonte_recursos" "public"."SystemConnectionType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."data_mappings_system" DROP COLUMN "email_account",
DROP COLUMN "extra_data_account",
DROP COLUMN "id_in_system_account",
DROP COLUMN "identity_id_hr",
DROP COLUMN "name_account",
DROP COLUMN "status_account",
DROP COLUMN "user_type_account",
ADD COLUMN     "map_accounts_email" TEXT,
ADD COLUMN     "map_accounts_id_in_system" TEXT,
ADD COLUMN     "map_accounts_identity_id" TEXT,
ADD COLUMN     "map_accounts_name" TEXT,
ADD COLUMN     "map_accounts_status" TEXT,
ADD COLUMN     "map_resources_description" TEXT,
ADD COLUMN     "map_resources_id_in_system" TEXT,
ADD COLUMN     "map_resources_name" TEXT;
