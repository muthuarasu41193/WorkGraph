FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript tsx --save-dev && npm run build
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
