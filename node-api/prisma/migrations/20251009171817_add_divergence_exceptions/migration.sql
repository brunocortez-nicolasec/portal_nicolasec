-- CreateTable
CREATE TABLE "public"."divergence_exceptions" (
    "id" SERIAL NOT NULL,
    "divergenceCode" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "identityId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "divergence_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "divergence_exceptions_identityId_divergenceCode_key" ON "public"."divergence_exceptions"("identityId", "divergenceCode");

-- AddForeignKey
ALTER TABLE "public"."divergence_exceptions" ADD CONSTRAINT "divergence_exceptions_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."divergence_exceptions" ADD CONSTRAINT "divergence_exceptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
