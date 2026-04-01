/*
  Warnings:

  - You are about to drop the column `status` on the `KanbanTask` table. All the data in the column will be lost.
  - Added the required column `date` to the `KanbanTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `KanbanTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KanbanTask" DROP COLUMN "status",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "TaskStatus";
