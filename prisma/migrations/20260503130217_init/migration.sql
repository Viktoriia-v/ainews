-- CreateTable
CREATE TABLE "Check" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "keySources" JSONB NOT NULL,
    "factCheckHits" JSONB,
    "contradictions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingMs" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "Check_createdAt_idx" ON "Check"("createdAt");
