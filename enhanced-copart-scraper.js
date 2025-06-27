// Enhanced Copart Scraper with Anti-Bot Bypass Techniques
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class EnhancedCopartScraper {
    constructor(headless = true) {
        console.log("Initializing Enhanced CopartScraper with anti-bot bypass...");
        this.headless = headless;
        this.browser = null;
        this.page = null;
        
        // Enhanced browser options to bypass detection
        this.launchOptions = {
            headless: this.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI,VizDisplayCompositor',
                '--disable-ipc-flooding-protection',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=site-per-process',
                '--window-size=1920,1080',
                '--log-level=3',
                // Additional stealth options
                '--disable-extensions-except=/path/to/extension',
                '--disable-plugins-discovery',
                '--disable-default-apps',
                '--no-default-browser-check',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--mute-audio',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-client-side-phishing-detection',
                '--disable-default-apps',
                '--disable-hang-monitor',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--metrics-recording-only',
                '--safebrowsing-disable-auto-update',
                '--enable-automation',
                '--password-store=basic',
                '--use-mock-keychain'
            ],
            defaultViewport: null, // Use full screen
            ignoreDefaultArgs: ['--enable-automation'],
            executablePath: this.getChromePath()
        };
        
        // User agents rotation for better stealth
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    getChromePath() {
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            return process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        const fs = require('fs');
        const glob = require('glob');

        const renderPaths = [
            '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome',
            '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux/chrome'
        ];

        for (const pattern of renderPaths) {
            try {
                const matches = glob.sync(pattern);
                if (matches.length > 0 && fs.existsSync(matches[0])) {
                    console.log(`Found Chrome at: ${matches[0]}`);
                    return matches[0];
                }
            } catch (error) {
                continue;
            }
        }

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

        console.log('Using Puppeteer bundled Chrome');
        return undefined;
    }

    async initialize() {
        try {
            this.browser = await puppeteer.launch(this.launchOptions);
            this.page = await this.browser.newPage();
            
            // Enhanced stealth configuration
            await this.setupStealthMode();
            
            console.log("Enhanced Puppeteer initialized successfully with stealth mode.");
            return true;
        } catch (error) {
            console.error(`Failed to initialize Enhanced Puppeteer: ${error}`);
            this.browser = null;
            this.page = null;
            return false;
        }
    }

    async setupStealthMode() {
        // Remove webdriver property
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        // Override the plugins property to use a custom getter
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
        });

        // Override the languages property to use a custom getter
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        });

        // Override the permissions property
        await this.page.evaluateOnNewDocument(() => {
            const originalQuery = window.navigator.permissions.query;
            return window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        });

        // Mock chrome runtime
        await this.page.evaluateOnNewDocument(() => {
            window.chrome = {
                runtime: {},
            };
        });

        // Set random user agent
        const randomUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        await this.page.setUserAgent(randomUserAgent);

        // Set viewport to random size within reasonable bounds
        const width = 1366 + Math.floor(Math.random() * 554); // 1366-1920
        const height = 768 + Math.floor(Math.random() * 312); // 768-1080
        await this.page.setViewport({ width, height });

        // Set extra headers to mimic real browser
        await this.page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        });

        // Set default timeouts
        await this.page.setDefaultNavigationTimeout(60000);
        await this.page.setDefaultTimeout(30000);

        // Intercept and modify requests to avoid detection
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            // Block unnecessary resources to speed up loading
            const resourceType = request.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                // Allow images for our scraping but block others
                if (resourceType === 'image' && request.url().includes('copart')) {
                    request.continue();
                } else if (resourceType !== 'image') {
                    request.abort();
                } else {
                    request.continue();
                }
            } else {
                // Modify headers for main requests
                const headers = request.headers();
                headers['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
                request.continue({ headers });
            }
        });
    }

    async humanLikeDelay(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async humanLikeMouseMovement(page, targetX, targetY) {
        // Get current mouse position (start from a random position)
        const startX = Math.floor(Math.random() * 200) + 100;
        const startY = Math.floor(Math.random() * 200) + 100;
        
        // Move mouse in a curved path to target
        const steps = 10 + Math.floor(Math.random() * 10);
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = startX + (targetX - startX) * progress + (Math.random() - 0.5) * 10;
            const y = startY + (targetY - startY) * progress + (Math.random() - 0.5) * 10;
            
            await page.mouse.move(x, y);
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
        }
    }

    async getAllImageUrls(lotUrl) {
        if (!this.browser || !this.page) {
            console.log("Enhanced Puppeteer is not initialized. Cannot scrape.");
            return [];
        }

        console.log(`Navigating to: ${lotUrl} with enhanced stealth mode...`);
        const imageUrlsSet = new Set();

        // Enhanced selectors based on current Copart structure
        const seeAllPhotosButtonSelector = 'button[aria-label*="See all"], .see-all-photos-block, [data-testid="see-all-photos"]';
        const alternativeSeeAllSelector = 'span:contains("See all"), button:contains("Photos")';
        const mainImageSelector = '.image-galleria-dialog img, .gallery-main-image, [data-testid="main-image"]';
        const thumbnailImageSelector = '.p-galleria-thumbnail-item img, .thumbnail-image, [data-testid="thumbnail"]';
        const thumbnailNextButtonSelector = '.thumbnail-next-image-icon, .p-galleria-thumbnail-next, [data-testid="next-thumbnail"]';

        let navigationSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!navigationSuccess && retryCount < maxRetries) {
            try {
                retryCount++;
                console.log(`Enhanced navigation attempt ${retryCount}/${maxRetries}...`);

                if (!this.page || this.page.isClosed()) {
                    console.log("Creating new enhanced page...");
                    this.page = await this.browser.newPage();
                    await this.setupStealthMode();
                }

                // Navigate with enhanced options
                await this.page.goto(lotUrl, { 
                    waitUntil: ['domcontentloaded', 'networkidle0'],
                    timeout: 60000 
                });

                // Wait for page to stabilize with human-like delay
                await this.humanLikeDelay(3000, 5000);
                
                // Check if page loaded successfully
                const pageTitle = await this.page.title();
                if (pageTitle && !pageTitle.includes('Error') && !pageTitle.includes('404')) {
                    navigationSuccess = true;
                    console.log(`✓ Successfully navigated to page: ${pageTitle}`);
                } else {
                    throw new Error(`Page failed to load properly. Title: ${pageTitle}`);
                }

            } catch (error) {
                console.log(`Enhanced navigation attempt ${retryCount} failed: ${error.message}`);
                if (retryCount >= maxRetries) {
                    console.error("All enhanced navigation attempts failed. Aborting.");
                    return [];
                }
                await this.humanLikeDelay(2000, 4000);
            }
        }

        try {
            // Wait for images to load
            await this.page.waitForSelector('img', { timeout: 30000 });
            await this.humanLikeDelay(2000, 3000);

            // Try multiple selectors for the "See all photos" button - using exact selector from main.js
            let seeAllPhotosButton = null;
            const selectors = [
                'span.p-cursor-pointer.p-fs-14.see-all-photos-block', // Exact selector from main.js
                'button:contains("See all")',
                '.see-all-photos-block',
                '[data-testid="see-all-photos"]',
                'span:contains("Photos")',
                'button[aria-label*="photo"]'
            ];

            for (const selector of selectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 5000 });
                    seeAllPhotosButton = await this.page.$(selector);
                    if (seeAllPhotosButton) {
                        console.log(`Enhanced: Found "See all photos" button with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (seeAllPhotosButton) {
                // Human-like interaction
                const buttonBox = await seeAllPhotosButton.boundingBox();
                if (buttonBox) {
                    await this.humanLikeMouseMovement(this.page, 
                        buttonBox.x + buttonBox.width / 2, 
                        buttonBox.y + buttonBox.height / 2
                    );
                    await this.humanLikeDelay(500, 1000);
                    await seeAllPhotosButton.click();
                    console.log("✓ Clicked 'See all Photos' button with human-like interaction.");
                    await this.humanLikeDelay(2000, 3000);
                }
            } else {
                console.log("! 'See all Photos' button not found. Extracting images from main page...");
            }

            // Enhanced image extraction - focus only on vehicle images
            const imageData = await this.page.evaluate(() => {
                // Helper function to identify vehicle images
                function isVehicleImage(src) {
                    // Must contain copart image server domains
                    const hasCopartDomain = src.includes('cs.copart.com') || 
                                          src.includes('vis.copart.com') || 
                                          (src.includes('copart.com') && src.includes('VHL'));
                    
                    if (!hasCopartDomain) return false;
                    
                    // Exclude non-vehicle images
                    const excludePatterns = [
                        '/content/',           // Site content images
                        '.svg',               // SVG icons/flags
                        '.gif',               // Animated gifs (usually ads)
                        'banner',             // Banner ads
                        'logo',               // Logos
                        'flag',               // Country flags
                        'icon',               // Icons
                        'sprite',             // CSS sprites
                        'bg_',                // Background images
                        'button',             // Button images
                        'form-dots',          // Form decorations
                        'registration-',      // Registration related images
                        '/lg.php',            // Ad delivery scripts
                        'delivery',           // Ad delivery
                        'campaignid'          // Campaign/ad related
                    ];
                    
                    const isExcluded = excludePatterns.some(pattern => 
                        src.toLowerCase().includes(pattern.toLowerCase())
                    );
                    
                    if (isExcluded) return false;
                    
                    // Must have vehicle image characteristics
                    const hasVehiclePattern = src.includes('_ful.jpg') || 
                                            src.includes('_hrs.jpg') || 
                                            src.includes('_thb.jpg') || 
                                            src.includes('_sm.jpg') || 
                                            src.includes('_l.jpg') ||
                                            (src.includes('cs.copart.com') && src.includes('.jpg'));
                    
                    return hasVehiclePattern;
                }
                
                const images = [];
                const imgElements = document.querySelectorAll('img');
                
                imgElements.forEach(img => {
                    const src = img.getAttribute('data-original') || 
                               img.getAttribute('data-src') || 
                               img.getAttribute('src');
                    
                    if (src && isVehicleImage(src)) {
                        // Convert to full size URL
                        let fullSrc = src;
                        if (src.startsWith('//')) {
                            fullSrc = 'https:' + src;
                        }
                        
                        // Replace thumbnail indicators with full size
                        fullSrc = fullSrc.replace(/_thb\.jpg/g, '_ful.jpg');
                        fullSrc = fullSrc.replace(/_sm\.jpg/g, '_ful.jpg');
                        fullSrc = fullSrc.replace(/_l\.jpg/g, '_ful.jpg');
                        fullSrc = fullSrc.replace(/_thumb\.jpg/g, '_ful.jpg');
                        
                        images.push(fullSrc);
                    }
                });
                
                return [...new Set(images)]; // Remove duplicates
            });

            // Add extracted images to set
            imageData.forEach(url => imageUrlsSet.add(url));

            // Enhanced gallery dialog extraction - similar to main.js but with stealth
            try {
                // Wait for the gallery dialog's main image to be visible
                let totalImagesExpected = 0;

                try {
                    await this.page.waitForSelector('#zoomImgElement', { visible: true, timeout: 30000 });
                    console.log("Enhanced gallery dialog loaded: Main image element detected.");

                    // Try to get the total number of images from the "X of Y" counter
                    try {
                        await this.page.waitForSelector('span.nav-count', { visible: true, timeout: 30000 });
                        const navText = await this.page.$eval('span.nav-count', el => el.textContent);
                        const match = navText.match(/(\d+)\s+of\s+(\d+)/);
                        if (match) {
                            totalImagesExpected = parseInt(match[2]);
                            console.log(`Enhanced detection: ${totalImagesExpected} images in the gallery.`);
                        } else {
                            console.log("Could not parse total image count from enhanced gallery navigation text.");
                        }
                    } catch (error) {
                        console.log("Timeout waiting for enhanced gallery navigation count element.");
                    }
                } catch (error) {
                    console.log("Enhanced gallery dialog might not have fully loaded, continuing with thumbnail extraction...");
                }

                // Enhanced thumbnail carousel navigation - similar to main.js
                console.log("Enhanced collecting images by navigating the thumbnail carousel...");
                const enhancedThumbnailImageSelector = '.image-galleria-dialog .p-galleria-thumbnail-item img.p-galleria-img-thumbnail';
                const enhancedThumbnailNextButtonSelector = '.image-galleria-dialog .galleria-thumbnail-controls span.lot-details-sprite.thumbnail-next-image-icon';
                
                const thumbnailPrevSrcHolder = {}; // Object to hold prev_src for each thumbnail to detect change
                let thumbnailPageClicksDone = 0;
                const thumbnailPageClicksLimit = Math.max(Math.floor(totalImagesExpected / 8), 5); // At least 5 attempts

                while (thumbnailPageClicksDone <= thumbnailPageClicksLimit) {
                    // Get all currently visible thumbnails
                    const thumbnailElements = await this.page.$$(enhancedThumbnailImageSelector);
                    console.log(`Enhanced THUMBNAIL ELEMENTS: ${thumbnailElements.length}`);
                    
                    if (thumbnailElements.length === 0 && thumbnailPageClicksDone === 0) {
                        console.log("No initial thumbnails found in the enhanced gallery.");
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
                            console.log(`Enhanced: Stale element reference for thumbnail ${i}. Skipping this thumbnail for now.`);
                            continue; // Skip to next thumbnail
                        }
                    }

                    // Try to find and click the thumbnail 'next page' button with human-like behavior
                    try {
                        await this.page.waitForSelector(enhancedThumbnailNextButtonSelector, { timeout: 10000 });
                        
                        // Human-like interaction for next button
                        const nextButton = await this.page.$(enhancedThumbnailNextButtonSelector);
                        if (nextButton) {
                            const buttonBox = await nextButton.boundingBox();
                            if (buttonBox) {
                                await this.humanLikeMouseMovement(this.page, 
                                    buttonBox.x + buttonBox.width / 2, 
                                    buttonBox.y + buttonBox.height / 2
                                );
                                await this.humanLikeDelay(300, 700);
                                await nextButton.click();
                                await this.humanLikeDelay(1500, 2500); // Wait for thumbnail carousel to slide
                            }
                        }
                    } catch (error) {
                        console.log("Enhanced: Thumbnail 'next page' button not found or not clickable. Assuming end of thumbnail gallery.");
                        break; // No more thumbnail pages
                    }

                    thumbnailPageClicksDone++;
                }

                console.log(`Enhanced: Finished iterating all galleries. Collected ${imageUrlsSet.size} unique image URLs.`);

            } catch (error) {
                console.log(`Enhanced gallery extraction error: ${error.message}`);
            }

            console.log(`Enhanced extraction completed. Found ${imageUrlsSet.size} unique image URLs.`);
            return Array.from(imageUrlsSet).sort();

        } catch (error) {
            console.error(`Enhanced extraction error: ${error}`);
            try {
                if (this.page && !this.page.isClosed()) {
                    const screenshotPath = "enhanced_copart_error_screenshot.png";
                    await this.page.screenshot({ path: screenshotPath, fullPage: true });
                    console.log(`Enhanced error screenshot saved to: ${path.resolve(screenshotPath)}`);
                }
            } catch (screenshotError) {
                console.log("Could not take enhanced error screenshot.");
            }
            return [];
        }
    }

    async downloadImages(urls, downloadFolder = "enhanced_copart_images") {
        if (!urls || urls.length === 0) {
            console.log("No URLs provided for enhanced download.");
            return 0;
        }

        try {
            await fs.mkdir(downloadFolder, { recursive: true });
            console.log(`Created enhanced download folder: ${downloadFolder}`);
        } catch (error) {
            console.error(`Error creating enhanced download folder ${downloadFolder}: ${error}`);
            return 0;
        }

        let downloadedCount = 0;
        console.log(`Starting enhanced download of ${urls.length} images to '${downloadFolder}'...`);

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                // Add delay between downloads to avoid rate limiting
                if (i > 0) {
                    await this.humanLikeDelay(1000, 2000);
                }

                const imageData = await this.downloadImageWithRetry(url, 3);
                
                const parsedUrl = new URL(url);
                const pathSegments = parsedUrl.pathname.split('/');
                let filenameSuggestion = pathSegments.reverse().find(s => s) || `enhanced_image_${String(i + 1).padStart(3, '0')}`;

                let filename = decodeURIComponent(filenameSuggestion);
                if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
                    filename += '.jpg';
                }

                let filepath = path.join(downloadFolder, filename);

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
                console.log(`✓ Enhanced download (${downloadedCount}/${urls.length}): ${path.basename(filepath)}`);

            } catch (error) {
                console.error(`✗ Enhanced download failed ${url}: ${error}`);
            }
        }

        console.log(`Enhanced download finished. Total: ${downloadedCount}/${urls.length} images.`);
        return downloadedCount;
    }

    async downloadImageWithRetry(url, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.downloadImage(url);
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                console.log(`Download attempt ${attempt} failed for ${url}, retrying...`);
                await this.humanLikeDelay(1000, 2000);
            }
        }
    }

    async downloadImage(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https:') ? https : http;
            const request = client.get(url, { 
                timeout: 15000,
                headers: {
                    'User-Agent': this.userAgents[Math.floor(Math.random() * this.userAgents.length)],
                    'Referer': 'https://www.copart.com/',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                }
            }, (response) => {
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
                reject(new Error('Enhanced request timeout'));
            });

            request.on('error', reject);
        });
    }

    async fileExists(filepath) {
        try {
            await fs.access(filepath);
            return true;
        } catch {
            return false;
        }
    }

    async scrapeListing(lotUrl, download = true) {
        console.log(`\n--- Starting enhanced scraping for lot: ${lotUrl} ---`);

        if (!this.browser) {
            const initialized = await this.initialize();
            if (!initialized) {
                return [];
            }
        }

        const imageUrls = await this.getAllImageUrls(lotUrl);

        if (imageUrls.length === 0) {
            console.log("No images found with enhanced scraping!");
            return [];
        }

        console.log(`Enhanced scraping found ${imageUrls.length} unique images.`);

        if (download) {
            const parsedUrl = new URL(lotUrl);
            const lotIdParts = parsedUrl.pathname.split('/').filter(part => part);
            let lotId = lotIdParts[lotIdParts.length - 1] || 'enhanced_listing';
            
            if (!/^\d+$/.test(lotId) && lotIdParts.length > 1) {
                const potentialLotId = lotIdParts[lotIdParts.length - 2];
                if (/^\d+$/.test(potentialLotId)) {
                    lotId = potentialLotId;
                } else {
                    lotId = lotIdParts[lotIdParts.length - 1].replace(/[^a-zA-Z0-9_-]/g, '');
                    if (!lotId) {
                        lotId = 'enhanced_listing';
                    }
                }
            }

            const downloadFolder = `enhanced_copart_images_${lotId}`;
            await this.downloadImages(imageUrls, downloadFolder);
        }

        console.log(`--- Enhanced scraping for lot: ${lotUrl} complete. ---`);
        return imageUrls;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log("Enhanced Puppeteer browser closed.");
        }
    }
}

// Enhanced usage example
async function enhancedMain() {
    const scraper = new EnhancedCopartScraper(false); // Set to true for headless

    try {
        // Example Copart lot URL
        const copartListingUrl = "https://www.copart.com/lot/62228515/clean-title-2019-bmw-x5-xdrive40i-ma-north-boston";

        const extractedImages = await scraper.scrapeListing(copartListingUrl, true);

        console.log("\n" + "=".repeat(60));
        console.log("ENHANCED COPART SCRAPING SUMMARY");
        console.log(`Total unique images found: ${extractedImages.length}`);
        console.log("=".repeat(60));

        const sampleUrls = extractedImages.slice(0, Math.min(extractedImages.length, 5));
        console.log("Sample extracted image URLs:");
        sampleUrls.forEach((url, index) => {
            console.log(`${index + 1}. ${url}`);
        });

        if (extractedImages.length > 5) {
            console.log(`... and ${extractedImages.length - 5} more images.`);
        }

    } finally {
        await scraper.close();
    }
}

module.exports = EnhancedCopartScraper;

if (require.main === module) {
    enhancedMain().catch(console.error);
}
