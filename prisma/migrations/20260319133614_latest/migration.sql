/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `payment_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `payment_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_tokens" ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payment_tokens_token_key" ON "payment_tokens"("token");
