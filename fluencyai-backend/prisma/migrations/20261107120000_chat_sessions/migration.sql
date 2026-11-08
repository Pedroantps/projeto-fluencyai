-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- AlterTable (sessionId nasce nulo para permitir o backfill)
ALTER TABLE "Message" ADD COLUMN "sessionId" TEXT;

-- Backfill: uma sessão "Conversa anterior" por usuário que já tem mensagens
INSERT INTO "ChatSession" ("id", "title", "createdAt", "updatedAt", "userId")
SELECT gen_random_uuid()::text, 'Conversa anterior', MIN(m."createdAt"), MAX(m."createdAt"), m."userId"
FROM "Message" m GROUP BY m."userId";

UPDATE "Message" m SET "sessionId" = s."id"
FROM "ChatSession" s WHERE s."userId" = m."userId";

ALTER TABLE "Message" ALTER COLUMN "sessionId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_taskId_key" ON "ChatSession"("taskId");
CREATE INDEX "ChatSession_userId_updatedAt_idx" ON "ChatSession"("userId", "updatedAt");
CREATE INDEX "ChatSession_userId_topic_idx" ON "ChatSession"("userId", "topic");
CREATE INDEX "Message_sessionId_createdAt_idx" ON "Message"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "KanbanTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
