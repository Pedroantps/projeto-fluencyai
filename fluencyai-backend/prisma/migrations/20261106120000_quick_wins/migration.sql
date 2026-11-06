-- CreateEnum
CREATE TYPE "ErrorCategory" AS ENUM ('verb_tense', 'preposition', 'article', 'word_order', 'word_choice', 'portuguese_word', 'spelling', 'other');
CREATE TYPE "ActivityType" AS ENUM ('chat', 'flashcard', 'video', 'dictation');

-- AlterEnum
ALTER TYPE "CardSource" ADD VALUE 'erro';

-- DropForeignKey
ALTER TABLE "Correction" DROP CONSTRAINT "Correction_messageId_fkey";

-- AlterTable (userId nasce nulo para permitir o backfill)
ALTER TABLE "Correction" ADD COLUMN "userId" TEXT,
ADD COLUMN "category" "ErrorCategory" NOT NULL DEFAULT 'other',
ADD COLUMN "flashcardCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "messageId" DROP NOT NULL;

-- Backfill: dono e data vêm da mensagem da IA
UPDATE "Correction" c SET "userId" = m."userId", "createdAt" = m."createdAt"
FROM "Message" m WHERE m."id" = c."messageId";
DELETE FROM "Correction" WHERE "userId" IS NULL;
ALTER TABLE "Correction" ALTER COLUMN "userId" SET NOT NULL;

-- CreateTable
CREATE TABLE "StudyActivity" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "ActivityType" NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "StudyActivity_pkey" PRIMARY KEY ("id")
);

-- Backfill: histórico de chat existente vira atividade (60s por mensagem do aluno)
INSERT INTO "StudyActivity" ("id", "date", "type", "seconds", "userId")
SELECT gen_random_uuid()::text, "createdAt"::date, 'chat', (COUNT(*) * 60)::int, "userId"
FROM "Message" WHERE "role" = 'USER'
GROUP BY "userId", "createdAt"::date;

-- CreateIndex
CREATE INDEX "Correction_userId_createdAt_idx" ON "Correction"("userId", "createdAt");
CREATE UNIQUE INDEX "StudyActivity_userId_date_type_key" ON "StudyActivity"("userId", "date", "type");

-- AddForeignKey
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudyActivity" ADD CONSTRAINT "StudyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
