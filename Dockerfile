FROM node:20-alpine

WORKDIR /app


COPY package*.json ./
RUN npm install 


COPY . .

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

CMD sh -c "npx prisma db push && node index.js"
