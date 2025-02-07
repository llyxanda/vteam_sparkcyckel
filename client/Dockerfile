FROM node:18 AS builder

WORKDIR /client

RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon-x11-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    ca-certificates \
    fonts-liberation \
    xdg-utils \
    wget

COPY package*.json ./
RUN npm install

FROM node:18

WORKDIR /client

# Copy node_modules from the builder stage
COPY --from=builder /client/node_modules ./node_modules
COPY . .

EXPOSE 8080

CMD ["node", "sim.mjs"]
