-- AlterTable
ALTER TABLE "Fix" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;
