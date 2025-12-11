FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

ENV PRISMA_CLIENT_ENGINE_TYPE="binary"

COPY . .

RUN npx prisma generate

EXPOSE 3005

CMD [ "node", "index.js" ]