const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stock-reports/raw-material',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('\n=== Testing Raw Material Stock API ===');
console.log('Endpoint: GET http://localhost:3000/api/stock-reports/raw-material');
console.log('\nSending request...\n');

const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', responseData);
        
        if (res.statusCode === 200) {
            console.log('\n✅ API SUCCESSFUL!');
            try {
                const data = JSON.parse(responseData);
                if (data.data && Array.isArray(data.data)) {
                    console.log(`\nFound ${data.data.length} raw material items`);
                }
            } catch (e) {
                console.log('Could not parse JSON response');
            }
        } else if (res.statusCode === 401) {
            console.log('\n❌ AUTHENTICATION REQUIRED - Need to send auth token');
        } else {
            console.log('\n❌ API FAILED');
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ Request Error:', error.message);
    console.error('Is the server running on http://localhost:3000?');
});

req.end();
