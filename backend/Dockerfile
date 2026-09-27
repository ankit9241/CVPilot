# ---------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

# Generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source files and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------------------------------------------------------
# Stage 2: Production Runtime
# ---------------------------------------------------------
FROM node:20-slim

WORKDIR /app

# Install XeLaTeX, required LaTeX packages, fonts, and OpenSSL for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    texlive-xetex \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    lmodern \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy generated Prisma Client and schema from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

# Copy compiled application from builder
COPY --from=builder /app/dist ./dist

# Copy LaTeX template files for templateEngineService
COPY src/templates ./src/templates
COPY src/templates ./dist/templates

# Ensure temp directory exists and is writable for LaTeX compilation
RUN mkdir -p /app/temp && chmod 777 /app/temp

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/index.js"]
