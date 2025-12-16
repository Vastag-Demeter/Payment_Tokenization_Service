FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

ENV PRISMA_CLIENT_ENGINE_TYPE="binary"

COPY . .

ARG DATABASE_URL

ENV DATABASE_URL=${DATABASE_URL}