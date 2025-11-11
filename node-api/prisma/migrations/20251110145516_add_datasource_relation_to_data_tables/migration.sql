/*
  Warnings:

  - Added the required column `dataSourceId` to the `IdentitiesHR` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataSourceId` to the `IdentitiesIDM` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."IdentitiesHR" ADD COLUMN     "dataSourceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."IdentitiesIDM" ADD COLUMN     "dataSourceId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."IdentitiesHR" ADD CONSTRAINT "IdentitiesHR_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdentitiesIDM" ADD CONSTRAINT "IdentitiesIDM_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
