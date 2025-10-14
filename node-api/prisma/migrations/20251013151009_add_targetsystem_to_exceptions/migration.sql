/*
  Warnings:

  - A unique constraint covering the columns `[identityId,divergenceCode,targetSystem]` on the table `divergence_exceptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."divergence_exceptions_identityId_divergenceCode_key";

-- AlterTable
ALTER TABLE "public"."divergence_exceptions" ADD COLUMN     "targetSystem" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "divergence_exceptions_identityId_divergenceCode_targetSyste_key" ON "public"."divergence_exceptions"("identityId", "divergenceCode", "targetSystem");
