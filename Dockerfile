FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (include dev for TypeScript build)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . ./
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY package*.json ./
# Install only production deps
RUN npm install --production

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/app.js"]
