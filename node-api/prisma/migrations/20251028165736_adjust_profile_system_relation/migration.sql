/*
  Warnings:

  - A unique constraint covering the columns `[systemId,name]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Made the column `systemId` on table `profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."profiles" DROP CONSTRAINT "profiles_systemId_fkey";

-- DropIndex
DROP INDEX "public"."profiles_name_key";

-- AlterTable
ALTER TABLE "public"."profiles" ALTER COLUMN "systemId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_systemId_name_key" ON "public"."profiles"("systemId", "name");

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
