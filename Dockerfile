FROM node:20-alpine

WORKDIR /app

# 1. Függőségek
COPY package*.json ./
RUN npm install 

# 2. Forráskód és Prisma generálás
COPY . .
# Ideiglenes URL csak a generáláshoz
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

# 3. Indító parancs (EZ HIÁNYZOTT!)
# Először szinkronizáljuk a sémát, utána indítjuk a szervert
CMD sh -c "npx prisma db push && node index.js"