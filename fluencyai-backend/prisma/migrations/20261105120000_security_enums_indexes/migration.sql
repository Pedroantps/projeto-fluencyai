-- CreateEnum
CREATE TYPE "Level" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE "TaskType" AS ENUM ('video', 'flashcard', 'chat');
CREATE TYPE "CardSource" AS ENUM ('chat', 'cronograma', 'aleatorio');

-- Normaliza valores legados fora do enum antes de converter
UPDATE "User" SET "level" = 'B1' WHERE "level" NOT IN ('A1','A2','B1','B2','C1','C2');
UPDATE "KanbanTask" SET "type" = 'chat' WHERE "type" NOT IN ('video','flashcard','chat');
UPDATE "Flashcard" SET "source" = 'aleatorio' WHERE "source" NOT IN ('chat','cronograma','aleatorio');

-- AlterTable: User
ALTER TABLE "User" ADD COLUMN "firebaseUid" TEXT;
ALTER TABLE "User" ALTER COLUMN "level" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "level" TYPE "Level" USING ("level"::"Level");
ALTER TABLE "User" ALTER COLUMN "level" SET DEFAULT 'B1';

-- AlterTable: KanbanTask
ALTER TABLE "KanbanTask" ALTER COLUMN "type" TYPE "TaskType" USING ("type"::"TaskType");

-- AlterTable: Flashcard
ALTER TABLE "Flashcard" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "Flashcard" ALTER COLUMN "source" TYPE "CardSource" USING ("source"::"CardSource");
ALTER TABLE "Flashcard" ALTER COLUMN "source" SET DEFAULT 'chat';

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");
CREATE INDEX "Flashcard_userId_nextReviewDate_idx" ON "Flashcard"("userId", "nextReviewDate");
CREATE INDEX "KanbanTask_userId_date_idx" ON "KanbanTask"("userId", "date");
CREATE INDEX "WordBank_userId_used_idx" ON "WordBank"("userId", "used");
