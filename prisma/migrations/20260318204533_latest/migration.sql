/*
  Warnings:

  - You are about to drop the column `user_id` on the `payment_tokens` table. All the data in the column will be lost.
  - Added the required column `service_id` to the `payment_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_tokens" DROP COLUMN "user_id",
ADD COLUMN     "card_holder_name" VARCHAR(100),
ADD COLUMN     "service_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "authorized_services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "api_key" VARCHAR(64) NOT NULL,
    "can_tokenize" BOOLEAN NOT NULL DEFAULT true,
    "can_fetch" BOOLEAN NOT NULL DEFAULT false,
    "can_manage" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authorized_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authorized_services_name_key" ON "authorized_services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "authorized_services_api_key_key" ON "authorized_services"("api_key");

-- AddForeignKey
ALTER TABLE "payment_tokens" ADD CONSTRAINT "payment_tokens_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "authorized_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
