FROM node:22-alpine

WORKDIR /app

# Önce bağımlılıklar (katman önbelleği için)
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts

ENV PORT=3000 \
    DATA_FILE=/app/data/tasks.json \
    LOG_FILE=/app/logs/requests.log

EXPOSE 3000

CMD ["node", "src/server.js"]
