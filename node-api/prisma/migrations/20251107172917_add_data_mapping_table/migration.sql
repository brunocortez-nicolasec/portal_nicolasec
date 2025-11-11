-- CreateTable
CREATE TABLE "public"."data_mappings" (
    "id" SERIAL NOT NULL,
    "app_column" TEXT NOT NULL,
    "source_column" TEXT NOT NULL,
    "dataSourceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_mappings_dataSourceId_app_column_key" ON "public"."data_mappings"("dataSourceId", "app_column");

-- AddForeignKey
ALTER TABLE "public"."data_mappings" ADD CONSTRAINT "data_mappings_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
