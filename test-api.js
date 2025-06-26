const axios = require('axios');

// Test the Image URL Extractor API
async function testAPI() {
    const baseURL = 'http://localhost:3000';
    
    console.log('Testing Image URL Extractor API...\n');
    
    try {
        // Test 1: Check API info
        console.log('1. Testing API info endpoint...');
        const infoResponse = await axios.get(baseURL);
        console.log('✓ API Info:', infoResponse.data.name);
        console.log('✓ Available endpoints:', Object.keys(infoResponse.data.endpoints));
        
        // Test 2: Health check
        console.log('\n2. Testing health check...');
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log('✓ Health status:', healthResponse.data.status);
        console.log('✓ Extractor ready:', healthResponse.data.extractor_ready);
        
        // Test 3: Extract images from a Copart listing
        console.log('\n3. Testing image extraction...');
        const testUrl = 'https://www.copart.com/lot/60925615/clean-title-2022-audi-q5-e-prestige-55-ak-anchorage'; // Sample Copart listing
        
        const extractResponse = await axios.post(`${baseURL}/extract-images`, {
            url: testUrl
        });
        
        console.log('✓ Extraction successful:', extractResponse.data.success);
        console.log('✓ URL processed:', extractResponse.data.url);
        console.log('✓ Images found:', extractResponse.data.count);
        console.log('✓ Sample images:');
        
        if (extractResponse.data.images.length > 0) {
            extractResponse.data.images.slice(0, 3).forEach((img, index) => {
                console.log(`   ${index + 1}. ${img}`);
            });
            if (extractResponse.data.images.length > 3) {
                console.log(`   ... and ${extractResponse.data.images.length - 3} more`);
            }
        } else {
            console.log('   No images found on test page');
        }
        
        // Test 4: Error handling - invalid URL
        console.log('\n4. Testing error handling...');
        try {
            await axios.post(`${baseURL}/extract-images`, {
                url: 'not-a-valid-url'
            });
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✓ Invalid URL properly rejected:', error.response.data.error);
            } else {
                console.log('✗ Unexpected error response');
            }
        }
        
        // Test 5: Missing URL
        try {
            await axios.post(`${baseURL}/extract-images`, {});
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✓ Missing URL properly rejected:', error.response.data.error);
            } else {
                console.log('✗ Unexpected error response');
            }
        }
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the server is running with: npm start');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testAPI();
}

module.exports = testAPI;
