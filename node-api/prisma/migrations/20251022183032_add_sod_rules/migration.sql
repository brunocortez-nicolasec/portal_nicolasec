-- CreateTable
CREATE TABLE "public"."sod_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileAId" INTEGER NOT NULL,
    "profileBId" INTEGER NOT NULL,

    CONSTRAINT "sod_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sod_rules_userId_profileAId_profileBId_key" ON "public"."sod_rules"("userId", "profileAId", "profileBId");

-- AddForeignKey
ALTER TABLE "public"."sod_rules" ADD CONSTRAINT "sod_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sod_rules" ADD CONSTRAINT "sod_rules_profileAId_fkey" FOREIGN KEY ("profileAId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sod_rules" ADD CONSTRAINT "sod_rules_profileBId_fkey" FOREIGN KEY ("profileBId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
