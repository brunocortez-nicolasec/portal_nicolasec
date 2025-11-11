/*
  Warnings:

  - Added the required column `name_system` to the `System` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."System" ADD COLUMN     "name_system" TEXT NOT NULL;
