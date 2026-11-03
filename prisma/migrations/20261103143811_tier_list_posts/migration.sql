-- CreateTable
CREATE TABLE "TierListPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "columns" JSONB NOT NULL,

    CONSTRAINT "TierListPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierListPostLike" (
    "userId" TEXT NOT NULL,
    "tierListPostId" TEXT NOT NULL,

    CONSTRAINT "TierListPostLike_pkey" PRIMARY KEY ("userId","tierListPostId")
);

-- CreateTable
CREATE TABLE "TierListPostComment" (
    "id" TEXT NOT NULL,
    "tierListPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TierListPostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierListPostCommentLike" (
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,

    CONSTRAINT "TierListPostCommentLike_pkey" PRIMARY KEY ("userId","commentId")
);

-- CreateIndex
CREATE INDEX "TierListPost_userId_idx" ON "TierListPost"("userId");

-- CreateIndex
CREATE INDEX "TierListPost_createdAt_id_idx" ON "TierListPost"("createdAt", "id");

-- CreateIndex
CREATE INDEX "TierListPostLike_tierListPostId_idx" ON "TierListPostLike"("tierListPostId");

-- CreateIndex
CREATE INDEX "TierListPostComment_tierListPostId_parentId_createdAt_id_idx" ON "TierListPostComment"("tierListPostId", "parentId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "TierListPostComment_userId_idx" ON "TierListPostComment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TierListPostComment_id_tierListPostId_key" ON "TierListPostComment"("id", "tierListPostId");

-- CreateIndex
CREATE INDEX "TierListPostCommentLike_commentId_idx" ON "TierListPostCommentLike"("commentId");

-- AddForeignKey
ALTER TABLE "TierListPost" ADD CONSTRAINT "TierListPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListPostLike" ADD CONSTRAINT "TierListPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListPostLike" ADD CONSTRAINT "TierListPostLike_tierListPostId_fkey" FOREIGN KEY ("tierListPostId") REFERENCES "TierListPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListPostComment" ADD CONSTRAINT "TierListPostComment_tierListPostId_fkey" FOREIGN KEY ("tierListPostId") REFERENCES "TierListPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListPostComment" ADD CONSTRAINT "TierListPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListPostComment" ADD CONSTRAINT "TierListPostComment_parentId_tierListPostId_fkey" FOREIGN KEY ("parentId", "tierListPostId") REFERENCES "TierListPostComment"("id", "tierListPostId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListPostCommentLike" ADD CONSTRAINT "TierListPostCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListPostCommentLike" ADD CONSTRAINT "TierListPostCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "TierListPostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
