-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_identityId_fkey";

-- AlterTable
ALTER TABLE "public"."accounts" ALTER COLUMN "identityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
