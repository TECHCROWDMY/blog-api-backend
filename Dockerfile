# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage caching
COPY package*.json ./

# Install development dependencies to run the build
RUN npm install

# Copy source code and build the application
COPY . .
RUN npm run build

# Stage 2: Create a minimal production image
FROM node:20-alpine AS production

# Set the port Cloud Run expects
ENV PORT 8080

WORKDIR /usr/src/app

# Copy only production dependencies from the builder stage
COPY --from=builder /usr/src/app/package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev

# Copy the compiled application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Command to run the application
CMD [ "node", "dist/main" ]