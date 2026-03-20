/*
  Warnings:

  - You are about to drop the column `card_hash` on the `cards` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "cards_card_hash_key";

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "card_hash";
