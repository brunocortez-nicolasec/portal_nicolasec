-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "packageId" INTEGER;

-- CreateTable
CREATE TABLE "public"."platforms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."packages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_PackageToPlatform" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PackageToPlatform_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "platforms_name_key" ON "public"."platforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_key_key" ON "public"."platforms"("key");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_route_key" ON "public"."platforms"("route");

-- CreateIndex
CREATE UNIQUE INDEX "packages_name_key" ON "public"."packages"("name");

-- CreateIndex
CREATE INDEX "_PackageToPlatform_B_index" ON "public"."_PackageToPlatform"("B");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PackageToPlatform" ADD CONSTRAINT "_PackageToPlatform_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PackageToPlatform" ADD CONSTRAINT "_PackageToPlatform_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
