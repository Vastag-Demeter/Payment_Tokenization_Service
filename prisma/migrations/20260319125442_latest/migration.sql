/*
  Warnings:

  - A unique constraint covering the columns `[fingerprint]` on the table `cards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fingerprint` to the `cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "fingerprint" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cards_fingerprint_key" ON "cards"("fingerprint");
