-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "RawNeed" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawNeed_pkey" PRIMARY KEY ("id")
);
