# Social API — Cloud Run image (multi-stage, Node 22 alpine, listens on :8080).

FROM node:22-alpine AS build
WORKDIR /usr/src/app
# Short-circuit Secret Manager during the build.
ENV IS_BUILD_PHASE=true
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/atlas ./atlas
EXPOSE 8080
CMD ["node", "dist/api/server.js"]
