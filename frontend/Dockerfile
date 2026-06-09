# Angular SSR frontend — Cloud Run image.
# Mirrors the multi-stage Node 22 pattern used across the project.

FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 8080
# The SSR server entrypoint emitted by `ng build`.
CMD ["node", "dist/frontend/server/server.mjs"]
