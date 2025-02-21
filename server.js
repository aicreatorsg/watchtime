const express = require('express');
const youtubedl = require('youtube-dl-exec');
const app = express();
const port = process.env.PORT || 3000;

const VIDEO_URL = 'https://youtu.be/EH19G8UmUXY?si=_vZ5IP4LugCHhqcK';
const NUM_INSTANCES = 1000;
let activeStreams = 0;

async function startVideoStream() {
    try {
        // Get video info first
        const info = await youtubedl(VIDEO_URL, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            format: 'worst' // Use lowest quality to save bandwidth
        });

        console.log(`Starting stream for video: ${info.title}`);
        
        // Start multiple instances
        const startInstances = async () => {
            const promises = [];
            const BATCH_SIZE = 50;
            
            for (let i = 0; i < NUM_INSTANCES; i += BATCH_SIZE) {
                const currentBatch = Math.min(BATCH_SIZE, NUM_INSTANCES - i);
                console.log(`Starting batch ${i / BATCH_SIZE + 1}, size: ${currentBatch}`);
                
                for (let j = 0; j < currentBatch; j++) {
                    promises.push(
                        youtubedl.exec(VIDEO_URL, {
                            noWarnings: true,
                            noCallHome: true,
                            format: 'worst',
                            quiet: true,
                            simulate: true, // Don't actually download, just simulate playback
                            skipDownload: true
                        }).catch(err => console.error(`Stream error: ${err.message}`))
                    );
                    activeStreams++;
                }
                
                // Wait a bit between batches to prevent overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            return Promise.all(promises);
        };

        // Start the instances and handle completion
        startInstances().then(() => {
            console.log('All streams started successfully');
        }).catch(err => {
            console.error('Error in stream batch:', err);
        });

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
