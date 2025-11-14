-- AlterTable
ALTER TABLE "public"."Accounts" ADD COLUMN     "cpf_account" TEXT;

-- AlterTable
ALTER TABLE "public"."data_mappings_system" ADD COLUMN     "accounts_cpf" TEXT;

-- CreateTable
CREATE TABLE "public"."account_divergence_exceptions" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "divergenceCode" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "account_divergence_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity_divergence_exceptions" (
    "id" SERIAL NOT NULL,
    "identityId" INTEGER NOT NULL,
    "divergenceCode" TEXT NOT NULL,
    "targetSystem" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "identity_divergence_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_divergence_exceptions_accountId_divergenceCode_key" ON "public"."account_divergence_exceptions"("accountId", "divergenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "identity_divergence_exceptions_identityId_divergenceCode_ta_key" ON "public"."identity_divergence_exceptions"("identityId", "divergenceCode", "targetSystem");

-- AddForeignKey
ALTER TABLE "public"."account_divergence_exceptions" ADD CONSTRAINT "account_divergence_exceptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_divergence_exceptions" ADD CONSTRAINT "account_divergence_exceptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity_divergence_exceptions" ADD CONSTRAINT "identity_divergence_exceptions_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."IdentitiesHR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity_divergence_exceptions" ADD CONSTRAINT "identity_divergence_exceptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
