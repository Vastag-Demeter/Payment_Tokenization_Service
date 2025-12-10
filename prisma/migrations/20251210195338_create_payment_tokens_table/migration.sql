-- CreateTable
CREATE TABLE "payment_tokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(32) NOT NULL,
    "encrypted_data" BYTEA NOT NULL,
    "user_id" BIGINT NOT NULL,
    "last_four_digits" CHAR(4) NOT NULL,
    "expiration_date" CHAR(5) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_tokens_token_key" ON "payment_tokens"("token");
