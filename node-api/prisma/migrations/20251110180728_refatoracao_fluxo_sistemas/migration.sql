/*
  Warnings:

  - You are about to drop the `Account_Resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `System_Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `System_Resource` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `identityId` to the `Accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemId` to the `Accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemId` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Account_Resource" DROP CONSTRAINT "Account_Resource_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Account_Resource" DROP CONSTRAINT "Account_Resource_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."System_Account" DROP CONSTRAINT "System_Account_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."System_Account" DROP CONSTRAINT "System_Account_systemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."System_Resource" DROP CONSTRAINT "System_Resource_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."System_Resource" DROP CONSTRAINT "System_Resource_systemId_fkey";

-- AlterTable
ALTER TABLE "public"."Accounts" ADD COLUMN     "identityId" INTEGER NOT NULL,
ADD COLUMN     "systemId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Resource" ADD COLUMN     "systemId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."data_mappings_system" ADD COLUMN     "identity_id_hr" TEXT;

-- DropTable
DROP TABLE "public"."Account_Resource";

-- DropTable
DROP TABLE "public"."System_Account";

-- DropTable
DROP TABLE "public"."System_Resource";

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "accountId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("accountId","resourceId")
);

-- AddForeignKey
ALTER TABLE "public"."Accounts" ADD CONSTRAINT "Accounts_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."System"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Accounts" ADD CONSTRAINT "Accounts_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."IdentitiesHR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."System"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
