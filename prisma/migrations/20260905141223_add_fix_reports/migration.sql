-- CreateTable
CREATE TABLE "FixReport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reporterId" TEXT NOT NULL,
    "fixId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,

    CONSTRAINT "FixReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixReport_fixId_idx" ON "FixReport"("fixId");

-- CreateIndex
CREATE INDEX "FixReport_reporterId_idx" ON "FixReport"("reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "FixReport_reporterId_fixId_key" ON "FixReport"("reporterId", "fixId");

-- AddForeignKey
ALTER TABLE "FixReport" ADD CONSTRAINT "FixReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixReport" ADD CONSTRAINT "FixReport_fixId_fkey" FOREIGN KEY ("fixId") REFERENCES "Fix"("id") ON DELETE CASCADE ON UPDATE CASCADE;
