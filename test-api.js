// Test script to debug API issues
require('dotenv').config();
const { crud } = require('./config/database');
const { apiResponse } = require('./utils/helpers');

async function test() {
  try {
    console.log('Testing database connection...');
    
    // Test findAll
    console.log('\n1. Testing crud.findAll for categories...');
    const categories = await crud.findAll('categories', {}, { orderBy: 'category_name ASC' });
    console.log('SUCCESS - Found categories:', categories.length);
    console.log(categories);
    
    // Test apiResponse
    console.log('\n2. Testing apiResponse helper...');
    const response = apiResponse(true, categories);
    console.log('SUCCESS - API Response:', JSON.stringify(response, null, 2));
    
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
