/*
  Warnings:

  - You are about to drop the column `connection_details_system` on the `System` table. All the data in the column will be lost.
  - You are about to drop the column `dataSourceId` on the `System` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name_system]` on the table `System` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."System" DROP CONSTRAINT "System_dataSourceId_fkey";

-- DropIndex
DROP INDEX "public"."System_dataSourceId_key";

-- AlterTable
ALTER TABLE "public"."System" DROP COLUMN "connection_details_system",
DROP COLUMN "dataSourceId";

-- CreateTable
CREATE TABLE "public"."SystemConfig" (
    "id" SERIAL NOT NULL,
    "dataSourceId" INTEGER NOT NULL,
    "systemId" INTEGER NOT NULL,
    "diretorio_accounts" TEXT,
    "diretorio_resources" TEXT,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_dataSourceId_key" ON "public"."SystemConfig"("dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "System_name_system_key" ON "public"."System"("name_system");

-- AddForeignKey
ALTER TABLE "public"."SystemConfig" ADD CONSTRAINT "SystemConfig_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemConfig" ADD CONSTRAINT "SystemConfig_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."System"("id") ON DELETE CASCADE ON UPDATE CASCADE;
