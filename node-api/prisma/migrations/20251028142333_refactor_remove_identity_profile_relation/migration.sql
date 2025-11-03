/*
  Warnings:

  - You are about to drop the column `profileId` on the `identities` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `identities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf]` on the table `identities` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."identities" DROP CONSTRAINT "identities_profileId_fkey";

-- AlterTable
ALTER TABLE "public"."identities" DROP COLUMN "profileId";

-- AlterTable
ALTER TABLE "public"."profiles" ADD COLUMN     "systemId" INTEGER;

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" SERIAL NOT NULL,
    "accountIdInSystem" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "status" TEXT,
    "userType" TEXT,
    "cpf" TEXT,
    "extraData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "identityId" INTEGER NOT NULL,
    "systemId" INTEGER NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account_profiles" (
    "accountId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_profiles_pkey" PRIMARY KEY ("accountId","profileId")
);

-- CreateIndex
CREATE INDEX "accounts_identityId_idx" ON "public"."accounts"("identityId");

-- CreateIndex
CREATE INDEX "accounts_systemId_idx" ON "public"."accounts"("systemId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_systemId_accountIdInSystem_key" ON "public"."accounts"("systemId", "accountIdInSystem");

-- CreateIndex
CREATE INDEX "account_profiles_profileId_idx" ON "public"."account_profiles"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "identities_email_key" ON "public"."identities"("email");

-- CreateIndex
CREATE UNIQUE INDEX "identities_cpf_key" ON "public"."identities"("cpf");

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_profiles" ADD CONSTRAINT "account_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_profiles" ADD CONSTRAINT "account_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
