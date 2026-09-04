-- CreateEnum
CREATE TYPE "FixVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Fix" ADD COLUMN     "visibility" "FixVisibility" NOT NULL DEFAULT 'PRIVATE';
