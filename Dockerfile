# Use Node.js LTS (Long Term Support) version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache for dependencies
COPY package*.json ./

# Install dependencies
# npm ci is faster and more reliable for builds than npm install
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the frontend assets
RUN npm run build

# Expose the port the app runs on
ENV PORT=3001
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
