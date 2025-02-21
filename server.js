const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();
const port = process.env.PORT || 3000;

const VIDEO_URL = 'https://youtu.be/EH19G8UmUXY?si=_vZ5IP4LugCHhqcK';
const NUM_INSTANCES = 1000;
let activeStreams = 0;
let browser;

async function startVideoStream() {
    try {
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-extensions',
                '--use-gl=swiftshader',
                '--ignore-certificate-errors',
                '--mute-audio'
            ],
            headless: 'new'
        });

        const startInstances = async () => {
            const BATCH_SIZE = 50;
            
            for (let i = 0; i < NUM_INSTANCES; i += BATCH_SIZE) {
                const currentBatch = Math.min(BATCH_SIZE, NUM_INSTANCES - i);
                console.log(`Starting batch ${i / BATCH_SIZE + 1}, size: ${currentBatch}`);
                
                const batchPromises = [];
                for (let j = 0; j < currentBatch; j++) {
                    const promise = new Promise(async (resolve, reject) => {
                        try {
                            const page = await browser.newPage();
                            await page.setRequestInterception(true);
                            
                            // Block unnecessary resources
                            page.on('request', (req) => {
                                const resourceType = req.resourceType();
                                if (resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet') {
                                    req.abort();
                                } else {
                                    req.continue();
                                }
                            });

                            // Set viewport to minimum size
                            await page.setViewport({
                                width: 480,
                                height: 270
                            });

                            // Navigate to video
                            await page.goto(VIDEO_URL, {
                                waitUntil: 'networkidle0',
                                timeout: 30000
                            });

                            // Click play button if needed
                            try {
                                await page.click('.ytp-play-button');
                            } catch (e) {
                                console.log('Play button not found or already playing');
                            }

                            // Set video quality to lowest
                            await page.evaluate(() => {
                                const video = document.querySelector('video');
                                if (video) {
                                    video.playbackRate = 1;
                                    video.volume = 0;
                                }
                            });

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
                
                // Wait between batches
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        };

        console.log('Starting video streams...');
        await startInstances();
        console.log('All streams started successfully');

    } catch (error) {
        console.error('Error starting video streams:', error);
        if (browser) {
            await browser.close();
        }
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
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal, shutting down...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});
