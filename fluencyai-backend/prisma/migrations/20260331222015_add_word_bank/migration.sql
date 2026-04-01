-- CreateTable
CREATE TABLE "WordBank" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "context" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WordBank_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WordBank" ADD CONSTRAINT "WordBank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
