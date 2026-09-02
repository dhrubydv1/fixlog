/*
  Warnings:

  - Made the column `userId` on table `Fix` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Fix" ALTER COLUMN "userId" SET NOT NULL;
