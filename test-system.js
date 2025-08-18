#!/usr/bin/env node

const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

console.log('🧪 AI Model Management System - Component Test\n');

// Test utilities
function logTest(name, status, details = '') {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${name}: ${status}`);
    if (details) console.log(`   ${details}`);
}

async function testEndpoint(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test 1: Server Health
async function testServerHealth() {
    console.log('1. Testing Server Health...');
    
    const result = await testEndpoint('/api/content');
    if (result.success) {
        logTest('Server Health', 'PASS', 'Server is running and responding');
    } else {
        logTest('Server Health', 'FAIL', `Server error: ${result.error || result.status}`);
    }
}

// Test 2: Database Connection
async function testDatabaseConnection() {
    console.log('\n2. Testing Database Connection...');
    
    const result = await testEndpoint('/api/content');
    if (result.success && Array.isArray(result.data.content)) {
        logTest('Database Connection', 'PASS', `Found ${result.data.content.length} content items`);
    } else {
        logTest('Database Connection', 'FAIL', 'Cannot connect to database or query content');
    }
}

// Test 3: Google Sheets API (Mock Test)
async function testGoogleSheetsAPI() {
    console.log('\n3. Testing Google Sheets API...');
    
    // Check if credentials are configured
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const fs = require('fs');
        if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
            logTest('Google Credentials', 'PASS', 'Credentials file found');
        } else {
            logTest('Google Credentials', 'FAIL', 'Credentials file not found');
        }
    } else {
        logTest('Google Credentials', 'WARN', 'GOOGLE_APPLICATION_CREDENTIALS not set');
    }
}

// Test 4: OpenAI API
async function testOpenAIAPI() {
    console.log('\n4. Testing OpenAI API...');
    
    if (process.env.OPENAI_API_KEY) {
        logTest('OpenAI API Key', 'PASS', 'API key is configured');
    } else {
        logTest('OpenAI API Key', 'FAIL', 'OPENAI_API_KEY not set');
    }
}

// Test 5: Content Extraction Endpoint
async function testContentExtraction() {
    console.log('\n5. Testing Content Extraction Endpoints...');
    
    // Test Google Doc endpoint
    const docResult = await testEndpoint('/api/extract/google-doc', 'POST', {
        docId: 'test-doc-id'
    });
    
    if (docResult.status === 400) {
        logTest('Google Doc Endpoint', 'PASS', 'Endpoint exists (expected validation error)');
    } else {
        logTest('Google Doc Endpoint', 'FAIL', 'Endpoint not working correctly');
    }
    
    // Test Google Sheet endpoint
    const sheetResult = await testEndpoint('/api/extract/google-sheet', 'POST', {
        sheetId: 'test-sheet-id'
    });
    
    if (sheetResult.status === 400) {
        logTest('Google Sheet Endpoint', 'PASS', 'Endpoint exists (expected validation error)');
    } else {
        logTest('Google Sheet Endpoint', 'FAIL', 'Endpoint not working correctly');
    }
    
    // Test smart extraction endpoint
    const smartResult = await testEndpoint('/api/extract/google-content', 'POST', {
        urlOrId: 'test-url'
    });
    
    if (smartResult.status === 400) {
        logTest('Smart Extraction Endpoint', 'PASS', 'Endpoint exists (expected validation error)');
    } else {
        logTest('Smart Extraction Endpoint', 'FAIL', 'Endpoint not working correctly');
    }
}

// Test 6: Fine-tuning Endpoint
async function testFineTuning() {
    console.log('\n6. Testing Fine-tuning Endpoints...');
    
    const result = await testEndpoint('/api/fine-tune/start', 'POST');
    
    if (result.status === 500) {
        logTest('Fine-tuning Endpoint', 'PASS', 'Endpoint exists (expected no content error)');
    } else {
        logTest('Fine-tuning Endpoint', 'FAIL', 'Endpoint not working correctly');
    }
}

// Test 7: Model Management Endpoints
async function testModelManagement() {
    console.log('\n7. Testing Model Management Endpoints...');
    
    // Test get models
    const getResult = await testEndpoint('/api/models');
    if (getResult.success) {
        logTest('Get Models Endpoint', 'PASS', 'Endpoint working');
    } else {
        logTest('Get Models Endpoint', 'FAIL', 'Endpoint not working');
    }
    
    // Test deploy model
    const deployResult = await testEndpoint('/api/deploy/model', 'POST', {
        jobId: 'test-job-id'
    });
    
    if (deployResult.status === 400) {
        logTest('Deploy Model Endpoint', 'PASS', 'Endpoint exists (expected validation error)');
    } else {
        logTest('Deploy Model Endpoint', 'FAIL', 'Endpoint not working correctly');
    }
}

// Test 8: Evaluation Endpoints
async function testEvaluation() {
    console.log('\n8. Testing Evaluation Endpoints...');
    
    const result = await testEndpoint('/api/evaluate/history');
    if (result.success) {
        logTest('Evaluation History Endpoint', 'PASS', 'Endpoint working');
    } else {
        logTest('Evaluation History Endpoint', 'FAIL', 'Endpoint not working');
    }
}

// Test 9: Admin Interface
async function testAdminInterface() {
    console.log('\n9. Testing Admin Interface...');
    
    const result = await fetch(`${BASE_URL}/admin`);
    if (result.ok) {
        logTest('Admin Interface', 'PASS', 'Admin panel accessible');
    } else {
        logTest('Admin Interface', 'FAIL', 'Admin panel not accessible');
    }
}

// Main test function
async function runAllTests() {
    console.log('Starting comprehensive system test...\n');
    
    await testServerHealth();
    await testDatabaseConnection();
    await testGoogleSheetsAPI();
    await testOpenAIAPI();
    await testContentExtraction();
    await testFineTuning();
    await testModelManagement();
    await testEvaluation();
    await testAdminInterface();
    
    console.log('\n🎯 Test Summary:');
    console.log('All endpoints should be accessible and responding correctly.');
    console.log('Some tests may show expected errors (like validation errors) which is normal.');
    console.log('\nNext steps:');
    console.log('1. Follow the TESTING-GUIDE.md for detailed testing with real data');
    console.log('2. Create a Google Sheet with test data');
    console.log('3. Extract content and start fine-tuning');
    console.log('4. Deploy and evaluate your model');
}

// Run tests
runAllTests().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
