FROM mcr.microsoft.com/playwright:v1.42.1-jammy

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev

COPY index.js ./

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "index.js"]
