const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testHeatTreatmentUpdateAPI() {
    try {
        console.log('\n=== Testing Heat Treatment Update API ===\n');
        
        // First, get existing heat treatment record
        console.log('Step 1: Fetching existing heat treatment record...');
        const getResponse = await axios.get(`${API_BASE}/heat-treatment/1`);
        console.log('✓ GET successful');
        console.log('Current data:', JSON.stringify(getResponse.data.data, null, 2));
        
        const currentData = getResponse.data.data;
        
        // Step 2: Try to update with modified data
        console.log('\nStep 2: Attempting UPDATE...');
        const updateData = {
            treatment_date: currentData.treatment_date.split('T')[0],
            furnace_no: currentData.furnace_no,
            size_item_id: currentData.size_item_id,
            time_in: currentData.time_in,
            time_out: currentData.time_out,
            temperature: currentData.temperature,
            bags_produced: currentData.bags_produced + 1 // Change bags
        };
        
        console.log('Update payload:', JSON.stringify(updateData, null, 2));
        
        const updateResponse = await axios.put(`${API_BASE}/heat-treatment/1`, updateData);
        console.log('\n✓ UPDATE successful!');
        console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
        
        // Restore original value
        console.log('\nStep 3: Restoring original value...');
        updateData.bags_produced = currentData.bags_produced;
        await axios.put(`${API_BASE}/heat-treatment/1`, updateData);
        console.log('✓ Restored');
        
    } catch (error) {
        console.error('\n❌ API Test Failed!');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received from server');
            console.error('Is the server running on http://localhost:3000?');
        } else {
            console.error('Error:', error.message);
        }
    }
}

testHeatTreatmentUpdateAPI();
