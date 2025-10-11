-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT,
    "blueprintUrl" TEXT,
    "tokensUrl" TEXT,
    "issueNumber" INTEGER,
    "prUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "md" TEXT,
    "html" TEXT,
    CONSTRAINT "Page_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_url_key" ON "Page"("url");
