#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🤖 AI Model Management System Setup\n');

// Check environment variables
function checkEnvironment() {
    console.log('📋 Checking environment variables...');
    
    const requiredVars = [
        'OPENAI_API_KEY',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
    ];
    
    const missing = [];
    
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });
    
    if (missing.length > 0) {
        console.log('❌ Missing environment variables:');
        missing.forEach(varName => {
            console.log(`   - ${varName}`);
        });
        console.log('\nPlease add these to your .env file');
        return false;
    }
    
    console.log('✅ All required environment variables are set');
    return true;
}

// Check Google credentials
function checkGoogleCredentials() {
    console.log('\n📄 Checking Google credentials...');
    
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!credentialsPath) {
        console.log('⚠️  GOOGLE_APPLICATION_CREDENTIALS not set');
        console.log('   Google Docs and Sheets extraction will not work');
        console.log('   You can set this later if needed');
        return false;
    }
    
    if (!fs.existsSync(credentialsPath)) {
        console.log('❌ Google credentials file not found at:', credentialsPath);
        return false;
    }
    
    try {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        if (!credentials.client_email || !credentials.private_key) {
            console.log('❌ Invalid Google credentials format');
            return false;
        }
        console.log('✅ Google credentials are valid');
        console.log('   Supports: Google Docs and Google Sheets extraction');
        return true;
    } catch (error) {
        console.log('❌ Error reading Google credentials:', error.message);
        return false;
    }
}

// Test database connection
async function testDatabase() {
    console.log('\n🗄️  Testing database connection...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        // Test connection by querying a table
        const { data, error } = await supabase
            .from('content_sources')
            .select('count')
            .limit(1);
        
        if (error) {
            console.log('❌ Database connection failed:', error.message);
            console.log('   Please check your Supabase credentials and ensure the database schema is created');
            return false;
        }
        
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.log('❌ Database connection error:', error.message);
        return false;
    }
}

// Test OpenAI API
async function testOpenAI() {
    console.log('\n🧠 Testing OpenAI API...');
    
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.log('❌ OpenAI API test failed:', error.error?.message || 'Unknown error');
            return false;
        }
        
        console.log('✅ OpenAI API connection successful');
        return true;
    } catch (error) {
        console.log('❌ OpenAI API test error:', error.message);
        return false;
    }
}

// Create temp directory
function createTempDirectory() {
    console.log('\n📁 Creating temporary directory...');
    
    const tempDir = path.join(__dirname, 'temp');
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('✅ Temporary directory created');
    } else {
        console.log('✅ Temporary directory already exists');
    }
}

// Main setup function
async function main() {
    console.log('🚀 Starting setup...\n');
    
    const results = {
        environment: checkEnvironment(),
        googleCredentials: checkGoogleCredentials(),
        database: await testDatabase(),
        openai: await testOpenAI()
    };
    
    createTempDirectory();
    
    console.log('\n📊 Setup Summary:');
    console.log(`   Environment Variables: ${results.environment ? '✅' : '❌'}`);
    console.log(`   Google Credentials: ${results.googleCredentials ? '✅' : '⚠️'}`);
    console.log(`   Database Connection: ${results.database ? '✅' : '❌'}`);
    console.log(`   OpenAI API: ${results.openai ? '✅' : '❌'}`);
    
    const criticalFailures = !results.environment || !results.database || !results.openai;
    
    if (criticalFailures) {
        console.log('\n❌ Setup incomplete. Please fix the issues above before proceeding.');
        process.exit(1);
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Access the admin panel: http://localhost:3000/admin');
    console.log('3. Extract content from Google Docs');
    console.log('4. Start fine-tuning process');
    console.log('5. Deploy and evaluate models');
    
    if (!results.googleCredentials) {
        console.log('\nNote: Google Docs extraction is not configured.');
        console.log('To enable it:');
        console.log('1. Set up Google Cloud project');
        console.log('2. Enable Google Docs API');
        console.log('3. Create service account and download credentials');
        console.log('4. Set GOOGLE_APPLICATION_CREDENTIALS in .env');
    }
}

// Run setup
main().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
});
