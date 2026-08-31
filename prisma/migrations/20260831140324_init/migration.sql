-- CreateTable
CREATE TABLE "Fix" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "errorMessage" TEXT,
    "cause" TEXT,
    "solution" TEXT NOT NULL,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fix_pkey" PRIMARY KEY ("id")
);
