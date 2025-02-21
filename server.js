const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

const VIDEO_URL = 'https://youtu.be/EH19G8UmUXY?si=_vZ5IP4LugCHhqcK';
const NUM_INSTANCES = 1000;
let activeStreams = 0;

async function startVideoStream() {
    try {
        // Start multiple instances
        const startInstances = async () => {
            const promises = [];
            const BATCH_SIZE = 50;
            
            for (let i = 0; i < NUM_INSTANCES; i += BATCH_SIZE) {
                const currentBatch = Math.min(BATCH_SIZE, NUM_INSTANCES - i);
                console.log(`Starting batch ${i / BATCH_SIZE + 1}, size: ${currentBatch}`);
                
                for (let j = 0; j < currentBatch; j++) {
                    const promise = new Promise((resolve, reject) => {
                        const process = exec(`yt-dlp ${VIDEO_URL} --no-warnings --no-call-home --format worst -o - > /dev/null`, 
                            (error, stdout, stderr) => {
                                if (error) {
                                    console.error(`Stream error: ${error.message}`);
                                    reject(error);
                                    return;
                                }
                                resolve();
                            }
                        );
                    });
                    promises.push(promise);
                    activeStreams++;
                }
                
                // Wait a bit between batches to prevent overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            return Promise.all(promises);
        };

        // Start the instances and handle completion
        console.log('Starting video streams...');
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
