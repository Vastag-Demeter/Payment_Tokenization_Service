/*
  Warnings:

  - You are about to drop the column `card_holder_name` on the `payment_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `encrypted_data` on the `payment_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `payment_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `last_four_digits` on the `payment_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `payment_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `payment_tokens` table. All the data in the column will be lost.
  - Added the required column `card_id` to the `payment_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "payment_tokens_token_key";

-- AlterTable
ALTER TABLE "payment_tokens" DROP COLUMN "card_holder_name",
DROP COLUMN "encrypted_data",
DROP COLUMN "expiration_date",
DROP COLUMN "last_four_digits",
DROP COLUMN "token",
DROP COLUMN "updated_at",
ADD COLUMN     "card_id" INTEGER NOT NULL,
ALTER COLUMN "is_active" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "encrypted_data" BYTEA NOT NULL,
    "card_holder_name" VARCHAR(100) NOT NULL,
    "last_four_digits" CHAR(4) NOT NULL,
    "expiration_date" CHAR(5) NOT NULL,
    "card_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_card_hash_key" ON "cards"("card_hash");

-- AddForeignKey
ALTER TABLE "payment_tokens" ADD CONSTRAINT "payment_tokens_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
