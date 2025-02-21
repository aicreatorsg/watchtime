FROM node:16-slim

WORKDIR /usr/src/app

# Install youtube-dl and its dependencies
RUN apt-get update && \
    apt-get install -y python3 ffmpeg youtube-dl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD [ "node", "server.js" ]
