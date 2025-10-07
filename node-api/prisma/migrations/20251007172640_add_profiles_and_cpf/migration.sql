-- AlterTable
ALTER TABLE "public"."identities" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "profileId" INTEGER;

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_name_key" ON "public"."profiles"("name");

-- AddForeignKey
ALTER TABLE "public"."identities" ADD CONSTRAINT "identities_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
