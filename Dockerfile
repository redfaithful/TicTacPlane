# --- Build stage: compile the Angular app and bundle the Node server ---
FROM node:22 AS build
WORKDIR /app

# Install dependencies against the lockfile for reproducible builds.
COPY package*.json ./
RUN npm ci

# Build the browser bundle (dist/tic-tac-plane/browser) and the self-contained
# server bundle (dist-server/server.js).
COPY . .
RUN npm run build && npm run build:server

# --- Runtime stage: only the built artifacts, no node_modules needed ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# esbuild inlines express/ws into the bundle, so we ship just the outputs.
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# Cloud Run injects PORT; default to 8080 for local `docker run`.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist-server/server.js"]
