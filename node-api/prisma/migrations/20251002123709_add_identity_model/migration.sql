-- CreateTable
CREATE TABLE "public"."identities" (
    "id" SERIAL NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "status" TEXT,
    "userType" TEXT,
    "extraData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identities_sourceSystem_identityId_key" ON "public"."identities"("sourceSystem", "identityId");
