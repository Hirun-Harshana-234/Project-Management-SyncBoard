FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm install

FROM dependencies AS build
COPY client ./client
RUN npm run build --workspace client

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm install --omit=dev --workspace server && npm cache clean --force
COPY server ./server
COPY --from=build /app/client/dist ./client/dist
RUN chown -R node:node /app
USER node
EXPOSE 8080
CMD ["node", "server/src/server.js"]

