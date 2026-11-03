-- CreateTable
CREATE TABLE "TierList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierListColumn" (
    "id" TEXT NOT NULL,
    "tierListId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'tier',
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "TierListColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierListGame" (
    "id" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "thumb" TEXT NOT NULL,

    CONSTRAINT "TierListGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TierList_userId_key" ON "TierList"("userId");

-- CreateIndex
CREATE INDEX "TierListColumn_tierListId_idx" ON "TierListColumn"("tierListId");

-- CreateIndex
CREATE UNIQUE INDEX "TierListColumn_tierListId_position_key" ON "TierListColumn"("tierListId", "position");

-- CreateIndex
CREATE INDEX "TierListGame_columnId_idx" ON "TierListGame"("columnId");

-- CreateIndex
CREATE UNIQUE INDEX "TierListGame_columnId_position_key" ON "TierListGame"("columnId", "position");

-- AddForeignKey
ALTER TABLE "TierList" ADD CONSTRAINT "TierList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListColumn" ADD CONSTRAINT "TierListColumn_tierListId_fkey" FOREIGN KEY ("tierListId") REFERENCES "TierList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListGame" ADD CONSTRAINT "TierListGame_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "TierListColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
