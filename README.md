# Image URL Extractor API

A Node.js Express API that extracts image URLs from any webpage using Puppeteer. This API can scrape images from any website and return a list of all found image URLs.

## Features

- ✅ Extract images from any webpage
- ✅ Handles dynamic content loaded by JavaScript
- ✅ Extracts images from `img` tags, `srcset` attributes, and CSS background images
- ✅ Filters out icons, tracking pixels, and other non-content images
- ✅ Converts relative URLs to absolute URLs
- ✅ RESTful API with JSON responses
- ✅ CORS enabled for cross-origin requests
- ✅ Proper error handling and validation

## Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### POST /extract-images

Extract image URLs from a webpage.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.png",
    "https://example.com/image3.webp"
  ],
  "count": 3,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid URL format",
  "message": "Please provide a valid URL"
}
```

### GET /health

Check if the API is running and ready.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "extractor_ready": true
}
```

### GET /

Get API information and usage instructions.

## Usage Examples

### Using curl

```bash
# Extract images from a webpage
curl -X POST http://localhost:3000/extract-images \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Health check
curl http://localhost:3000/health
```

### Using JavaScript (Node.js)

```javascript
const axios = require('axios');

async function extractImages(url) {
  try {
    const response = await axios.post('http://localhost:3000/extract-images', {
      url: url
    });
    
    console.log(`Found ${response.data.count} images:`);
    response.data.images.forEach((img, index) => {
      console.log(`${index + 1}. ${img}`);
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Extract images from a website
extractImages('https://example.com');
```

### Using JavaScript (Browser)

```javascript
async function extractImages(url) {
  try {
    const response = await fetch('http://localhost:3000/extract-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`Found ${data.count} images:`, data.images);
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### Using Python

```python
import requests

def extract_images(url):
    try:
        response = requests.post('http://localhost:3000/extract-images', 
                               json={'url': url})
        data = response.json()
        
        if data['success']:
            print(f"Found {data['count']} images:")
            for i, img in enumerate(data['images'], 1):
                print(f"{i}. {img}")
        else:
            print(f"Error: {data['error']}")
    except Exception as e:
        print(f"Error: {e}")

# Extract images from a website
extract_images('https://example.com')
```

## Testing

Run the included test script to verify the API is working:

```bash
node test-api.js
```

Make sure the server is running before running tests.

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)

### Browser Options

The Puppeteer browser runs in headless mode by default for better performance. You can modify the browser options in `image-extractor.js` if needed.

## How It Works

1. **Puppeteer Browser**: Uses a headless Chrome browser to load webpages
2. **Image Detection**: Scans for images in multiple ways:
   - `<img>` tags with `src`, `data-src`, `data-original` attributes
   - `srcset` and `data-srcset` attributes for responsive images
   - CSS background images
3. **URL Processing**: Converts relative URLs to absolute URLs
4. **Filtering**: Removes common non-content images (icons, tracking pixels, etc.)
5. **Deduplication**: Returns only unique image URLs

## Limitations

- Requires Chrome/Chromium to be installed (comes with Puppeteer)
- May not work with websites that have strict anti-bot measures
- Processing time depends on webpage complexity and size
- Some images may require user interaction to load (not handled automatically)

## Error Handling

The API handles various error scenarios:

- Invalid or missing URLs
- Network timeouts
- Browser initialization failures
- Webpage loading errors
- Server errors

All errors return appropriate HTTP status codes and descriptive error messages.

## Dependencies

- **Express**: Web framework
- **Puppeteer**: Headless Chrome automation
- **CORS**: Cross-origin resource sharing
- **Axios**: HTTP client (for testing)

## License

ISC License
