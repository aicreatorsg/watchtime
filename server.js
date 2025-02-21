const express = require('express');
const play = require('play-dl');
const app = express();
const port = process.env.PORT || 3000;

const VIDEO_URL = 'https://youtu.be/EH19G8UmUXY?si=_vZ5IP4LugCHhqcK';
const NUM_INSTANCES = 1000;
let activeStreams = 0;

async function startVideoStream() {
    try {
        // Get video info
        const videoInfo = await play.video_info(VIDEO_URL);
        console.log(`Starting streams for video: ${videoInfo.video_details.title}`);

        // Start multiple instances
        const startInstances = async () => {
            const BATCH_SIZE = 50;
            
            for (let i = 0; i < NUM_INSTANCES; i += BATCH_SIZE) {
                const currentBatch = Math.min(BATCH_SIZE, NUM_INSTANCES - i);
                console.log(`Starting batch ${i / BATCH_SIZE + 1}, size: ${currentBatch}`);
                
                const batchPromises = [];
                for (let j = 0; j < currentBatch; j++) {
                    const promise = new Promise(async (resolve, reject) => {
                        try {
                            const stream = await play.stream(VIDEO_URL, {
                                quality: 144, // Lowest quality
                                discordPlayerCompatibility: false
                            });
                            
                            // Create a dummy stream that consumes data but doesn't store it
                            const dummyStream = {
                                write: () => {},
                                end: () => {}
                            };

                            stream.stream.pipe(dummyStream);
                            activeStreams++;
                            resolve();
                        } catch (error) {
                            console.error('Stream error:', error);
                            reject(error);
                        }
                    });
                    batchPromises.push(promise);
                }
                
                await Promise.allSettled(batchPromises);
                console.log(`Batch ${i / BATCH_SIZE + 1} completed. Active streams: ${activeStreams}`);
                
                // Wait a bit between batches to prevent overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        };

        // Start the instances
        console.log('Starting video streams...');
        await startInstances();
        console.log('All streams started successfully');

    } catch (error) {
        console.error('Error starting video streams:', error);
    }
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        activeStreams,
        videoUrl: VIDEO_URL
    });
});

// Start the server and initialize streams
app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    await startVideoStream();
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal, shutting down...');
    process.exit(0);
});
