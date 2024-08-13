/*
  Warnings:

  - A unique constraint covering the columns `[emoji]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN "emoji" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Category_emoji_key" ON "Category"("emoji");
