FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the application port
EXPOSE 5005

# Start the application
CMD ["npm", "start"]
