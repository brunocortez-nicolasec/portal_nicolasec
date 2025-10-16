-- AlterTable
ALTER TABLE "public"."systems" ADD COLUMN     "connectionDetails" JSONB,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'CSV';
