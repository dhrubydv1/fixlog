-- AlterTable
ALTER TABLE "Fix" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Fix_userId_idx" ON "Fix"("userId");

-- AddForeignKey
ALTER TABLE "Fix" ADD CONSTRAINT "Fix_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
