# Dockerfile for OpenMusic full-stack app

# --- Build client ---
FROM node:20-alpine AS client-build
WORKDIR /app
COPY client ./client
COPY package.json package-lock.json ./
RUN cd client && npm install && npm run build

# --- Build server ---
FROM node:20-alpine AS server-build
WORKDIR /app
COPY server ./server
COPY shared ./shared
COPY package.json package-lock.json ./
RUN cd server && npm install && npm run build

# --- Final image ---
FROM node:20-alpine
WORKDIR /app
# Copy built client and server
COPY --from=client-build /app/client/dist ./client/dist
COPY --from=server-build /app/server ./server
COPY --from=server-build /app/shared ./shared
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Expose port (change if your server uses a different port)
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]
