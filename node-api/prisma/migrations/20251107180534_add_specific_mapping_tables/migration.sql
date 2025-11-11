/*
  Warnings:

  - You are about to drop the `data_mappings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."data_mappings" DROP CONSTRAINT "data_mappings_dataSourceId_fkey";

-- DropTable
DROP TABLE "public"."data_mappings";

-- CreateTable
CREATE TABLE "public"."data_mappings_hr" (
    "id" SERIAL NOT NULL,
    "dataSourceId" INTEGER NOT NULL,
    "map_identity_id_hr" TEXT,
    "map_name_hr" TEXT,
    "map_email_hr" TEXT,
    "map_status_hr" TEXT,
    "map_user_type_hr" TEXT,
    "map_cpf_hr" TEXT,
    "map_extra_data_hr" TEXT,

    CONSTRAINT "data_mappings_hr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_mappings_idm" (
    "id" SERIAL NOT NULL,
    "dataSourceId" INTEGER NOT NULL,
    "map_identity_id_idm" TEXT,
    "map_name_idm" TEXT,
    "map_email_idm" TEXT,
    "map_status_idm" TEXT,
    "map_extra_data_idm" TEXT,

    CONSTRAINT "data_mappings_idm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_mappings_system" (
    "id" SERIAL NOT NULL,
    "dataSourceId" INTEGER NOT NULL,
    "map_id_in_system_account" TEXT,
    "map_name_account" TEXT,
    "map_email_account" TEXT,
    "map_status_account" TEXT,
    "map_user_type_account" TEXT,
    "map_extra_data_account" TEXT,

    CONSTRAINT "data_mappings_system_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_mappings_hr_dataSourceId_key" ON "public"."data_mappings_hr"("dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "data_mappings_idm_dataSourceId_key" ON "public"."data_mappings_idm"("dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "data_mappings_system_dataSourceId_key" ON "public"."data_mappings_system"("dataSourceId");

-- AddForeignKey
ALTER TABLE "public"."data_mappings_hr" ADD CONSTRAINT "data_mappings_hr_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_mappings_idm" ADD CONSTRAINT "data_mappings_idm_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_mappings_system" ADD CONSTRAINT "data_mappings_system_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
