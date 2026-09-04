-- CreateTable
CREATE TABLE "HelpfulVote" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "fixId" INTEGER NOT NULL,

    CONSTRAINT "HelpfulVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HelpfulVote_fixId_idx" ON "HelpfulVote"("fixId");

-- CreateIndex
CREATE INDEX "HelpfulVote_userId_idx" ON "HelpfulVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HelpfulVote_userId_fixId_key" ON "HelpfulVote"("userId", "fixId");

-- AddForeignKey
ALTER TABLE "HelpfulVote" ADD CONSTRAINT "HelpfulVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpfulVote" ADD CONSTRAINT "HelpfulVote_fixId_fkey" FOREIGN KEY ("fixId") REFERENCES "Fix"("id") ON DELETE CASCADE ON UPDATE CASCADE;
