
# Stage 1: Build the TypeScript application
FROM node:20-alpine AS builder

WORKDIR /backend

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build


# Stage 2: Run the production application
FROM node:20-alpine AS production

WORKDIR /backend

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /backend/dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
