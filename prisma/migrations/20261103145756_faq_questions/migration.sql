-- CreateTable
CREATE TABLE "FaqQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "theme" TEXT,
    "gameId" INTEGER,
    "gameName" TEXT,
    "gameThumb" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaqQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqQuestionLike" (
    "userId" TEXT NOT NULL,
    "faqQuestionId" TEXT NOT NULL,

    CONSTRAINT "FaqQuestionLike_pkey" PRIMARY KEY ("userId","faqQuestionId")
);

-- CreateTable
CREATE TABLE "FaqQuestionComment" (
    "id" TEXT NOT NULL,
    "faqQuestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaqQuestionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqQuestionCommentLike" (
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,

    CONSTRAINT "FaqQuestionCommentLike_pkey" PRIMARY KEY ("userId","commentId")
);

-- CreateIndex
CREATE INDEX "FaqQuestion_userId_idx" ON "FaqQuestion"("userId");

-- CreateIndex
CREATE INDEX "FaqQuestion_createdAt_id_idx" ON "FaqQuestion"("createdAt", "id");

-- CreateIndex
CREATE INDEX "FaqQuestionLike_faqQuestionId_idx" ON "FaqQuestionLike"("faqQuestionId");

-- CreateIndex
CREATE INDEX "FaqQuestionComment_faqQuestionId_parentId_createdAt_id_idx" ON "FaqQuestionComment"("faqQuestionId", "parentId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "FaqQuestionComment_userId_idx" ON "FaqQuestionComment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FaqQuestionComment_id_faqQuestionId_key" ON "FaqQuestionComment"("id", "faqQuestionId");

-- CreateIndex
CREATE INDEX "FaqQuestionCommentLike_commentId_idx" ON "FaqQuestionCommentLike"("commentId");

-- AddForeignKey
ALTER TABLE "FaqQuestion" ADD CONSTRAINT "FaqQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqQuestionLike" ADD CONSTRAINT "FaqQuestionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqQuestionLike" ADD CONSTRAINT "FaqQuestionLike_faqQuestionId_fkey" FOREIGN KEY ("faqQuestionId") REFERENCES "FaqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqQuestionComment" ADD CONSTRAINT "FaqQuestionComment_faqQuestionId_fkey" FOREIGN KEY ("faqQuestionId") REFERENCES "FaqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqQuestionComment" ADD CONSTRAINT "FaqQuestionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqQuestionComment" ADD CONSTRAINT "FaqQuestionComment_parentId_faqQuestionId_fkey" FOREIGN KEY ("parentId", "faqQuestionId") REFERENCES "FaqQuestionComment"("id", "faqQuestionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqQuestionCommentLike" ADD CONSTRAINT "FaqQuestionCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqQuestionCommentLike" ADD CONSTRAINT "FaqQuestionCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "FaqQuestionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
