-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_sourceId_idx" ON "Comment"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_sourceId_externalId_key" ON "Comment"("sourceId", "externalId");
