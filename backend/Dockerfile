FROM oven/bun:1-alpine

WORKDIR /app

# Install dependencies using bun
COPY package.json bun.lock* ./
RUN bun install

COPY . .

# Run the app with bun's native typescript executor
CMD ["bun", "run", "src/app.ts"]
