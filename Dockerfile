FROM node:16-slim

WORKDIR /usr/src/app

# Install Python 3.9 and other dependencies
RUN apt-get update && \
    apt-get install -y python3.9 python3-pip ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
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
