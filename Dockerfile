FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy app source
COPY . .

# Build
RUN npm run build

# The database is mounted via Fly volume at /data
ENV DB_PATH=/data/library.db
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-p", "3000"]
