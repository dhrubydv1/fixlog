-- CreateEnum
CREATE TYPE "FixReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "FixReport" ADD COLUMN     "status" "FixReportStatus" NOT NULL DEFAULT 'OPEN';
