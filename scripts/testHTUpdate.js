const http = require('http');

const updateData = JSON.stringify({
    treatment_date: '2025-11-28',
    furnace_no: 1,
    size_item_id: 1,
    time_in: '10:00:00',
    time_out: '11:30:00',
    temperature: 400,
    bags_produced: 46 // Changed from 45
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/heat-treatment/1',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': updateData.length
    }
};

console.log('\n=== Testing Heat Treatment Update ===');
console.log('Endpoint: PUT http://localhost:3000/api/heat-treatment/1');
console.log('Payload:', updateData);
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
            console.log('\n✅ UPDATE SUCCESSFUL!');
        } else {
            console.log('\n❌ UPDATE FAILED');
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ Request Error:', error.message);
    console.error('Is the server running on http://localhost:3000?');
});

req.write(updateData);
req.end();
