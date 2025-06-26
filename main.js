// Import necessary libraries
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class CopartScraper {
    /**
     * A class to scrape image URLs from Copart lot pages using Puppeteer and optionally download them.
     * This structure is inspired by the CarsAndBidsScraper example provided.
     */

    constructor(headless = true) {
        /**
         * Initializes the CopartScraper with Puppeteer browser options.
         * 
         * @param {boolean} headless - If true, run Chrome in headless mode (without a visible GUI).
         */
        console.log("Initializing CopartScraper with Puppeteer...");
        this.headless = headless;
        this.browser = null;
        this.page = null;
        
        // Browser options optimized for Render deployment
        this.launchOptions = {
            headless: this.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--window-size=1920,1080',
                '--log-level=3'
            ],
            defaultViewport: {
                width: 1920,
                height: 1080
            },
            executablePath: this.getChromePath()
        };
    }

    getChromePath() {
        /**
         * Get the Chrome executable path for different environments
         */
        // Check if PUPPETEER_EXECUTABLE_PATH is set (manual override)
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            return process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        // Check for Render environment (common paths)
        const renderPaths = [
            '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome',
            '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux/chrome'
        ];

        const fs = require('fs');
        const glob = require('glob');

        // Try to find Chrome in Render cache directory
        for (const pattern of renderPaths) {
            try {
                const matches = glob.sync(pattern);
                if (matches.length > 0 && fs.existsSync(matches[0])) {
                    console.log(`Found Chrome at: ${matches[0]}`);
                    return matches[0];
                }
            } catch (error) {
                // Continue to next pattern
            }
        }

        // Fallback to system Chrome paths
        const systemPaths = [
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium'
        ];

        for (const chromePath of systemPaths) {
            if (fs.existsSync(chromePath)) {
                console.log(`Found Chrome at: ${chromePath}`);
                return chromePath;
            }
        }

        // Let Puppeteer use its bundled Chrome
        console.log('Using Puppeteer bundled Chrome');
        return undefined;
    }

    async initialize() {
        /**
         * Initialize the browser and page
         */
        try {
            this.browser = await puppeteer.launch(this.launchOptions);
            this.page = await this.browser.newPage();
            
            // Set user agent
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
            
            console.log("Puppeteer initialized successfully.");
            return true;
        } catch (error) {
            console.error(`Failed to initialize Puppeteer: ${error}`);
            console.error("Please ensure Chrome browser is installed and compatible with Puppeteer.");
            this.browser = null;
            this.page = null;
            return false;
        }
    }

    async getAllImageUrls(lotUrl) {
        /**
         * Extracts all relevant image URLs from a Copart lot page by interacting with the gallery.
         * This method will open the gallery, iterate through images by clicking the 'next' button,
         * and collect all unique full-size image URLs. It also iterates through thumbnail pagination.
         * 
         * @param {string} lotUrl - The URL of the Copart lot page.
         * @returns {Array<string>} A list of unique, full-size image URLs. Returns empty array on failure.
         */
        if (!this.browser || !this.page) {
            console.log("Puppeteer is not initialized. Cannot scrape.");
            return [];
        }

        console.log(`Navigating to: ${lotUrl} to open gallery and extract images...`);
        const imageUrlsSet = new Set(); // Use a Set to store unique URLs

        // Define selectors for the various buttons and elements as discussed
        const seeAllPhotosButtonSelector = 'span.p-cursor-pointer.p-fs-14.see-all-photos-block';
        const mainImageSelector = '#zoomImgElement';
        const thumbnailImageSelector = '.image-galleria-dialog .p-galleria-thumbnail-item img.p-galleria-img-thumbnail';
        const thumbnailNextButtonSelector = '.image-galleria-dialog .galleria-thumbnail-controls span.lot-details-sprite.thumbnail-next-image-icon';

        // Retry mechanism for navigation
        let navigationSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!navigationSuccess && retryCount < maxRetries) {
            try {
                retryCount++;
                console.log(`Navigation attempt ${retryCount}/${maxRetries}...`);

                // Recreate page if needed
                if (!this.page || this.page.isClosed()) {
                    console.log("Creating new page...");
                    this.page = await this.browser.newPage();
                    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
                    
                    // Set additional page configurations
                    await this.page.setViewport({ width: 1920, height: 1080 });
                    await this.page.setDefaultNavigationTimeout(60000);
                    await this.page.setDefaultTimeout(30000);
                }

                // Navigate with retry logic
                await this.page.goto(lotUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                });

                // Wait for page to stabilize
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Check if page loaded successfully by looking for basic elements
                const pageTitle = await this.page.title();
                if (pageTitle && !pageTitle.includes('Error') && !pageTitle.includes('404')) {
                    navigationSuccess = true;
                    console.log(`✓ Successfully navigated to page: ${pageTitle}`);
                } else {
                    throw new Error(`Page failed to load properly. Title: ${pageTitle}`);
                }

            } catch (error) {
                console.log(`Navigation attempt ${retryCount} failed: ${error.message}`);
                if (retryCount >= maxRetries) {
                    console.error("All navigation attempts failed. Aborting.");
                    return [];
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        try {

            // Attempt to click the "See all photos" button to open the gallery dialog
            try {
                await this.page.waitForSelector(seeAllPhotosButtonSelector, { timeout: 30000 });
                await this.page.click(seeAllPhotosButtonSelector);
                console.log("✓ Clicked 'See all Photos' button to open gallery.");
                await new Promise(resolve => setTimeout(resolve, 2000)); // Short wait for dialog to appear
            } catch (error) {
                console.log("! 'See all Photos' button not found or not clickable. Proceeding to extract from main page if available.");
                
                // If the button isn't found, we'll try to extract images directly from the main page if any exist
                try {
                    // Wait a bit more for page to stabilize
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Use a more robust approach to extract images
                    const imageData = await this.page.evaluate(() => {
                        const images = [];
                        const imgElements = document.querySelectorAll('img');
                        
                        imgElements.forEach(img => {
                            const src = img.getAttribute('data-original') || img.src;
                            if (src && src.includes('copart') && src.includes('VHL')) {
                                images.push(src);
                            }
                        });
                        
                        return images;
                    });
                    
                    // Process the extracted image URLs
                    for (const src of imageData) {
                        if (src && !['thumb', 'small', 'icon', 'preview', 'watermark'].some(f => src.toLowerCase().includes(f.toLowerCase()))) {
                            let finalSrc = src;
                            if (src.startsWith('//')) {
                                finalSrc = 'https:' + src;
                            }
                            imageUrlsSet.add(finalSrc);
                        }
                    }
                    
                    console.log(`Extracted ${imageUrlsSet.size} images from main page as fallback.`);
                    return Array.from(imageUrlsSet).sort(); // Return sorted array of found images
                    
                } catch (extractError) {
                    console.log(`Error extracting images from main page: ${extractError.message}`);
                    return []; // Return empty array if extraction fails
                }
            }

            // After clicking the button, wait for the gallery dialog's main image to be visible
            let totalImagesExpected = 0;

            try {
                await this.page.waitForSelector(mainImageSelector, { visible: true, timeout: 30000 });
                console.log("Gallery dialog loaded: Main image element detected.");

                // Try to get the total number of images from the "X of Y" counter
                try {
                    await this.page.waitForSelector('span.nav-count', { visible: true, timeout: 30000 });
                    const navText = await this.page.$eval('span.nav-count', el => el.textContent);
                    const match = navText.match(/(\d+)\s+of\s+(\d+)/);
                    if (match) {
                        totalImagesExpected = parseInt(match[2]);
                        console.log(`Detected ${totalImagesExpected} images in the gallery.`);
                    } else {
                        console.log("Could not parse total image count from gallery navigation text.");
                    }
                } catch (error) {
                    console.log("Timeout waiting for gallery navigation count element.");
                }
            } catch (error) {
                console.log("Timeout waiting for main image in gallery dialog. Gallery might not have fully loaded.");
                try {
                    if (!this.page.isClosed()) {
                        const screenshotPath = "copart_gallery_dialog_fail_screenshot.png";
                        await this.page.screenshot({ path: screenshotPath });
                        console.log(`Screenshot saved to: ${path.resolve(screenshotPath)} (check this for dialog state).`);
                    }
                } catch (screenshotError) {
                    console.log("Could not take screenshot - page may be closed or detached.");
                }
                return []; // Exit if the core gallery doesn't load
            }

            // --- Now, collect images from the thumbnail carousel if it has its own navigation ---
            console.log("Collecting images by navigating the thumbnail carousel...");
            const thumbnailPrevSrcHolder = {}; // Object to hold prev_src for each thumbnail to detect change
            let thumbnailPageClicksDone = 0;
            const thumbnailPageClicksLimit = Math.floor(totalImagesExpected / 8);

            while (thumbnailPageClicksDone <= thumbnailPageClicksLimit) {
                // Get all currently visible thumbnails
                const thumbnailElements = await this.page.$$(thumbnailImageSelector);
                console.log("THUMBNAIL ELEMENTS : ", thumbnailElements.length);
                
                if (thumbnailElements.length === 0 && thumbnailPageClicksDone === 0) {
                    console.log("No initial thumbnails found in the gallery.");
                    break; // No thumbnails to process
                }

                for (let i = 0; i < thumbnailElements.length; i++) {
                    try {
                        const thumbSrc = await thumbnailElements[i].evaluate(el => el.src);
                        if (thumbSrc) {
                            let finalThumbSrc = thumbSrc;
                            if (thumbSrc.startsWith('//')) {
                                finalThumbSrc = 'https:' + thumbSrc;
                            }

                            // Convert thumbnail URL to full-size URL
                            let fullSizeThumbUrl = finalThumbSrc.replace('_thb.jpg', '_ful.jpg');
                            fullSizeThumbUrl = fullSizeThumbUrl.replace('_sm.jpg', '_ful.jpg');
                            fullSizeThumbUrl = fullSizeThumbUrl.replace('_l.jpg', '_ful.jpg');

                            if (!imageUrlsSet.has(fullSizeThumbUrl)) {
                                imageUrlsSet.add(fullSizeThumbUrl);
                            }

                            // Store current source to detect change on next iteration
                            thumbnailPrevSrcHolder[i] = thumbSrc;
                        }
                    } catch (error) {
                        console.log(`Stale element reference for thumbnail ${i}. Skipping this thumbnail for now.`);
                        continue; // Skip to next thumbnail
                    }
                }

                // Try to find and click the thumbnail 'next page' button
                try {
                    await this.page.waitForSelector(thumbnailNextButtonSelector, { timeout: 30000 });
                    await this.page.click(thumbnailNextButtonSelector);
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Longer sleep to allow thumbnail carousel to slide
                } catch (error) {
                    console.log("Timeout: Thumbnail 'next page' button not found or not clickable. Assuming end of thumbnail gallery.");
                    break; // No more thumbnail pages
                }

                thumbnailPageClicksDone++;
            }

            console.log(`Finished iterating all galleries. Collected ${imageUrlsSet.size} unique image URLs.`);
            return Array.from(imageUrlsSet).sort(); // Convert set to sorted array

        } catch (error) {
            console.error(`An unexpected error occurred during image extraction: ${error}`);
            try {
                if (this.page && !this.page.isClosed()) {
                    const screenshotPath = "copart_error_screenshot.png";
                    await this.page.screenshot({ path: screenshotPath });
                    console.log(`Screenshot saved to: ${path.resolve(screenshotPath)}`);
                }
            } catch (screenshotError) {
                console.log("Could not take error screenshot - page may be closed or detached.");
            }
            return [];
        }
    }

    async downloadImages(urls, downloadFolder = "downloaded_copart_images") {
        /**
         * Downloads a list of image URLs to a specified folder.
         * 
         * @param {Array<string>} urls - A list of image URLs to download.
         * @param {string} downloadFolder - The name of the folder to save images to.
         * @returns {number} The number of images successfully downloaded.
         */
        if (!urls || urls.length === 0) {
            console.log("No URLs provided for download.");
            return 0;
        }

        // Create the download folder if it doesn't exist
        try {
            await fs.mkdir(downloadFolder, { recursive: true });
            console.log(`Created download folder: ${downloadFolder}`);
        } catch (error) {
            console.error(`Error creating download folder ${downloadFolder}: ${error}`);
            return 0;
        }

        let downloadedCount = 0;
        console.log(`Starting download of ${urls.length} images to '${downloadFolder}'...`);

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                const imageData = await this.downloadImage(url);
                
                // Extract a cleaner filename from the URL, or use a generic one
                const parsedUrl = new URL(url);
                const pathSegments = parsedUrl.pathname.split('/');
                // Try to find a meaningful segment, otherwise use a generic name
                let filenameSuggestion = pathSegments.reverse().find(s => s) || `image_${String(i + 1).padStart(3, '0')}`;

                // Clean up filename (remove query params, decode URL-encoded parts)
                let filename = decodeURIComponent(filenameSuggestion);
                // Ensure it has a common image extension or default to .jpg
                if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
                    filename += '.jpg'; // Default extension
                }

                let filepath = path.join(downloadFolder, filename);

                // Prevent overwriting if filename already exists (append a number)
                let counter = 1;
                const originalFilepath = filepath;
                while (await this.fileExists(filepath)) {
                    const ext = path.extname(originalFilepath);
                    const name = path.basename(originalFilepath, ext);
                    filepath = path.join(downloadFolder, `${name}_${counter}${ext}`);
                    counter++;
                }

                await fs.writeFile(filepath, imageData);
                downloadedCount++;
                console.log(`✓ Downloaded (${downloadedCount}/${urls.length}): ${path.basename(filepath)}`);

            } catch (error) {
                console.error(`✗ Failed to download ${url}: ${error}`);
            }
        }

        console.log(`Finished downloading. Total downloaded: ${downloadedCount}/${urls.length} images.`);
        return downloadedCount;
    }

    async downloadImage(url) {
        /**
         * Helper method to download a single image
         * @param {string} url - The image URL to download
         * @returns {Promise<Buffer>} The image data as a buffer
         */
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https:') ? https : http;
            const request = client.get(url, { timeout: 15000 }, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const chunks = [];
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
                response.on('error', reject);
            });

            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });

            request.on('error', reject);
        });
    }

    async fileExists(filepath) {
        /**
         * Helper method to check if a file exists
         * @param {string} filepath - The file path to check
         * @returns {Promise<boolean>} True if file exists, false otherwise
         */
        try {
            await fs.access(filepath);
            return true;
        } catch {
            return false;
        }
    }

    async scrapeListing(lotUrl, download = true) {
        /**
         * Performs the complete scraping workflow for a single Copart lot using Puppeteer.
         * 
         * @param {string} lotUrl - The URL of the Copart lot page.
         * @param {boolean} download - If true, downloads the extracted images.
         * @returns {Array<string>} A list of extracted image URLs.
         */
        console.log(`\n--- Starting scraping for lot: ${lotUrl} ---`);

        // Initialize browser if not already done
        if (!this.browser) {
            const initialized = await this.initialize();
            if (!initialized) {
                return [];
            }
        }

        // Extract all image URLs
        const imageUrls = await this.getAllImageUrls(lotUrl);

        if (imageUrls.length === 0) {
            console.log("No images found for this lot!");
            return [];
        }

        console.log(`Found ${imageUrls.length} unique images for this lot.`);

        // Download images if requested
        if (download) {
            // Create a specific folder name for this lot based on the URL
            const parsedUrl = new URL(lotUrl);
            // Extract the last path segment (lot number) as the folder name
            const lotIdParts = parsedUrl.pathname.split('/').filter(part => part);
            let lotId = lotIdParts[lotIdParts.length - 1] || 'listing';
            
            // If the last part is not a digit, try to get the second to last part if it's a number
            if (!/^\d+$/.test(lotId) && lotIdParts.length > 1) {
                const potentialLotId = lotIdParts[lotIdParts.length - 2];
                if (/^\d+$/.test(potentialLotId)) {
                    lotId = potentialLotId;
                } else {
                    // Fallback to a sanitized version of the last segment if no clear ID
                    lotId = lotIdParts[lotIdParts.length - 1].replace(/[^a-zA-Z0-9_-]/g, '');
                    if (!lotId) {
                        lotId = 'listing'; // Final fallback
                    }
                }
            }

            const downloadFolder = `copart_images_${lotId}`;
            await this.downloadImages(imageUrls, downloadFolder);
        }

        console.log(`--- Scraping for lot: ${lotUrl} complete. ---`);
        return imageUrls;
    }

    async close() {
        /**
         * Closes the Puppeteer browser instance.
         */
        if (this.browser) {
            await this.browser.close();
            console.log("Puppeteer browser closed.");
        }
    }
}

// --- Example Usage ---
async function main() {
    /**
     * Main function to run the Copart scraper example using Puppeteer.
     */
    // Initialize scraper (set headless=false if you want to see the browser GUI)
    const scraper = new CopartScraper(false);

    try {
        // Example Copart lot URL
        const copartListingUrl = "https://www.copart.com/lot/60925615/clean-title-2022-audi-q5-e-prestige-55-ak-anchorage";

        // Scrape the listing and download images
        const extractedImages = await scraper.scrapeListing(copartListingUrl, true);

        // Print summary of results
        console.log("\n" + "=".repeat(50));
        console.log("COPART SCRAPING SUMMARY");
        console.log(`Total unique images found: ${extractedImages.length}`);
        console.log("=".repeat(50));

        // Print first few URLs as sample (or all if less than 5)
        console.log("Sample extracted image URLs:");
        const sampleUrls = extractedImages.slice(0, Math.min(extractedImages.length, 5));
        sampleUrls.forEach((url, index) => {
            console.log(`${index + 1}. ${url}`);
        });

        if (extractedImages.length > 5) {
            console.log(`... and ${extractedImages.length - 5} more images (see full list above).`);
            console.log("Images are downloaded to a folder like 'copart_images_lotID' in the script directory.");
        } else if (extractedImages.length === 0) {
            console.log("No images were extracted. Check for errors in the logs and any generated screenshots.");
        }

    } finally {
        // Ensure the browser is always closed
        await scraper.close();
    }
}

// Export the class for use in other modules
module.exports = CopartScraper;

// Run the main function if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}
