const express = require('express');
const cors = require('cors');
const EnhancedCopartScraper = require('./enhanced-copart-scraper.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global enhanced scraper instance
let enhancedScraper = null;

// Initialize enhanced scraper on server start
async function initializeEnhancedScraper() {
    try {
        enhancedScraper = new EnhancedCopartScraper(true); // headless mode for API
        await enhancedScraper.initialize();
        console.log('Enhanced Copart scraper initialized successfully with anti-bot bypass');
    } catch (error) {
        console.error('Failed to initialize Enhanced Copart scraper:', error);
        enhancedScraper = null;
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

// Enhanced endpoint to extract images from URL with anti-bot bypass
app.post('/enhanced-extract-images', async (req, res) => {
    try {
        const { url, download = false } = req.body;

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

        // Initialize enhanced scraper if not already done
        if (!enhancedScraper) {
            console.log('Initializing Enhanced Copart scraper...');
            enhancedScraper = new EnhancedCopartScraper(true);
            const initialized = await enhancedScraper.initialize();
            if (!initialized) {
                return res.status(500).json({
                    success: false,
                    error: 'Enhanced Copart scraper initialization failed',
                    message: 'Unable to initialize enhanced browser for Copart scraping'
                });
            }
        }

        console.log(`Enhanced extracting images from Copart URL: ${url}`);
        
        // Extract images using Enhanced Copart scraper with anti-bot bypass
        const imageUrls = await enhancedScraper.getAllImageUrls(url);

        // Optionally download images if requested
        let downloadInfo = null;
        if (download && imageUrls.length > 0) {
            const parsedUrl = new URL(url);
            const lotIdParts = parsedUrl.pathname.split('/').filter(part => part);
            let lotId = lotIdParts.find(part => /^\d+$/.test(part)) || 'enhanced_listing';
            
            const downloadFolder = `enhanced_copart_images_${lotId}`;
            const downloadedCount = await enhancedScraper.downloadImages(imageUrls, downloadFolder);
            
            downloadInfo = {
                requested: true,
                folder: downloadFolder,
                downloaded: downloadedCount,
                total: imageUrls.length
            };
        }

        // Return enhanced results
        res.json({
            success: true,
            url: url,
            images: imageUrls,
            count: imageUrls.length,
            download: downloadInfo,
            enhanced: true,
            anti_bot_bypass: true,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Enhanced extraction error:', error);
        res.status(500).json({
            success: false,
            error: 'Enhanced extraction failed',
            message: 'Failed to extract images with anti-bot bypass techniques',
            details: error.message
        });
    }
});

// Comparison endpoint - run both scrapers and compare results
app.post('/compare-scrapers', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !isValidUrl(url) || !url.includes('copart.com')) {
            return res.status(400).json({
                success: false,
                error: 'Valid Copart URL is required'
            });
        }

        console.log(`Comparing scrapers for URL: ${url}`);

        // Initialize both scrapers if needed
        if (!enhancedScraper) {
            enhancedScraper = new EnhancedCopartScraper(true);
            await enhancedScraper.initialize();
        }

        const CopartScraper = require('./main.js');
        const basicScraper = new CopartScraper(true);
        await basicScraper.initialize();

        // Run both scrapers
        const [enhancedResults, basicResults] = await Promise.allSettled([
            enhancedScraper.getAllImageUrls(url),
            basicScraper.getAllImageUrls(url)
        ]);

        // Clean up basic scraper
        await basicScraper.close();

        const enhancedImages = enhancedResults.status === 'fulfilled' ? enhancedResults.value : [];
        const basicImages = basicResults.status === 'fulfilled' ? basicResults.value : [];

        res.json({
            success: true,
            url: url,
            comparison: {
                enhanced_scraper: {
                    status: enhancedResults.status,
                    images_found: enhancedImages.length,
                    images: enhancedImages,
                    error: enhancedResults.status === 'rejected' ? enhancedResults.reason.message : null
                },
                basic_scraper: {
                    status: basicResults.status,
                    images_found: basicImages.length,
                    images: basicImages,
                    error: basicResults.status === 'rejected' ? basicResults.reason.message : null
                },
                improvement: {
                    additional_images: Math.max(0, enhancedImages.length - basicImages.length),
                    success_rate_improvement: enhancedResults.status === 'fulfilled' && basicResults.status === 'rejected'
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Comparison error:', error);
        res.status(500).json({
            success: false,
            error: 'Comparison failed',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        enhanced_scraper_ready: enhancedScraper !== null,
        anti_bot_bypass: true
    });
});

// Get enhanced API information
app.get('/', (req, res) => {
    res.json({
        name: 'Enhanced Copart Image Extractor API',
        version: '2.0.0',
        description: 'Extract image URLs from Copart vehicle listings with anti-bot bypass techniques',
        features: [
            'Anti-bot detection bypass',
            'Human-like behavior simulation',
            'Enhanced stealth mode',
            'User agent rotation',
            'Request header spoofing',
            'Rate limiting avoidance',
            'Browser fingerprint masking'
        ],
        endpoints: {
            'POST /enhanced-extract-images': 'Extract image URLs with anti-bot bypass (recommended)',
            'POST /compare-scrapers': 'Compare basic vs enhanced scraper performance',
            'GET /health': 'Health check endpoint',
            'GET /': 'API information'
        },
        usage: {
            enhanced_endpoint: '/enhanced-extract-images',
            method: 'POST',
            body: {
                url: 'https://www.copart.com/lot/XXXXXXXX',
                download: false // optional: set to true to download images
            },
            note: 'Enhanced version bypasses Copart anti-bot measures'
        },
        anti_bot_techniques: [
            'Webdriver property removal',
            'Navigator object spoofing',
            'Chrome runtime mocking',
            'Random viewport sizing',
            'Human-like mouse movements',
            'Random delays between actions',
            'Request interception and modification',
            'Enhanced HTTP headers',
            'User agent rotation'
        ]
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down enhanced server...');
    if (enhancedScraper) {
        await enhancedScraper.close();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down enhanced server...');
    if (enhancedScraper) {
        await enhancedScraper.close();
    }
    process.exit(0);
});

// Start enhanced server
app.listen(PORT, async () => {
    console.log(`Enhanced Copart API server running on http://localhost:${PORT}`);
    console.log('Initializing Enhanced Copart scraper with anti-bot bypass...');
    await initializeEnhancedScraper();
    console.log('Enhanced server ready to bypass anti-bot measures!');
});

module.exports = app;
