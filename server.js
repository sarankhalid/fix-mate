const express = require('express');
const cors = require('cors');
const CopartScraper = require('./main.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Global scraper instance to reuse browser
let scraper = null;

// Initialize scraper on server start
async function initializeScraper() {
    try {
        scraper = new CopartScraper(true); // headless mode for API
        await scraper.initialize();
        console.log('Copart scraper initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Copart scraper:', error);
        scraper = null;
    }
}

// Utility function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Main endpoint to extract images from URL
app.post('/extract-images', async (req, res) => {
    try {
        const { url } = req.body;

        // Validate input
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required',
                message: 'Please provide a URL in the request body'
            });
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format',
                message: 'Please provide a valid URL'
            });
        }

        // Validate that it's a Copart URL
        if (!url.includes('copart.com')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL',
                message: 'This endpoint only works with Copart URLs (copart.com)'
            });
        }

        // Initialize scraper if not already done
        if (!scraper) {
            console.log('Initializing Copart scraper...');
            scraper = new CopartScraper(false);
            const initialized = await scraper.initialize();
            if (!initialized) {
                return res.status(500).json({
                    success: false,
                    error: 'Copart scraper initialization failed',
                    message: 'Unable to initialize browser for Copart scraping'
                });
            }
        }

        console.log(`Extracting images from Copart URL: ${url}`);
        
        // Extract images using Copart scraper
        const imageUrls = await scraper.getAllImageUrls(url);

        // Return results
        res.json({
            success: true,
            url: url,
            images: imageUrls,
            count: imageUrls.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error extracting images:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to extract images from the provided URL',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        scraper_ready: scraper !== null
    });
});

// Get API information
app.get('/', (req, res) => {
    res.json({
        name: 'Copart Image Extractor API',
        version: '1.0.0',
        description: 'Extract image URLs from Copart vehicle listings',
        endpoints: {
            'POST /extract-images': 'Extract image URLs from a Copart listing page',
            'GET /health': 'Health check endpoint',
            'GET /': 'API information'
        },
        usage: {
            endpoint: '/extract-images',
            method: 'POST',
            body: {
                url: 'https://www.copart.com/lot/XXXXXXXX'
            },
            note: 'Only Copart URLs (copart.com) are supported'
        }
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    if (scraper) {
        await scraper.close();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down server...');
    if (scraper) {
        await scraper.close();
    }
    process.exit(0);
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Initializing Copart scraper...');
    await initializeScraper();
    console.log('Server ready to accept requests!');
});

module.exports = app;
