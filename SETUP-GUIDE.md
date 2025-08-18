# 🔧 Setup Guide: Environment Configuration

This guide will help you set up the required environment variables to get your AI Model Management System running.

## 📋 Required Environment Variables

You need to create a `.env` file in your project root with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Cloud Configuration (Optional - for Google Docs/Sheets extraction)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🚀 Step-by-Step Setup

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `.env`: `OPENAI_API_KEY=sk-your-key-here`

**Note**: You need fine-tuning access for the full functionality. Check your OpenAI account for fine-tuning permissions.

### 2. Set Up Supabase Database

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the URL and anon key
5. Add to `.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Set Up Database Schema

1. In your Supabase project, go to SQL Editor
2. Copy the contents of `database-schema.sql`
3. Run the SQL to create the required tables

### 4. Set Up Google Cloud (Optional)

**For Google Docs/Sheets extraction:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable APIs:
   - Google Docs API
   - Google Sheets API
4. Create a service account:
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Download the JSON credentials file
5. Add to `.env`: `GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json`
6. Place the credentials file in your project root

## 🔧 Quick Setup Commands

### Create .env file:
```bash
# Create the .env file
touch .env

# Edit with your preferred editor
nano .env
# or
code .env
```

### Test the setup:
```bash
# Run setup verification
npm run setup

# If successful, start the server
npm start
```

## 🧪 Testing Without Google Sheets

If you don't want to set up Google Cloud initially, you can still test the system:

1. **Skip Google credentials** - the system will work without them
2. **Use sample data** - the database schema includes sample content
3. **Test fine-tuning** - with the sample data
4. **Add Google Sheets later** - when you're ready

## 🎯 Minimal Working Setup

For a minimal setup to test the system:

```env
# Required
OPENAI_API_KEY=sk-your-openai-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-key

# Optional (can add later)
# GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Server
PORT=3000
NODE_ENV=development
```

## 🔍 Verification Steps

After setting up your `.env` file:

1. **Run setup check**:
   ```bash
   npm run setup
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Access admin panel**:
   ```
   http://localhost:3000/admin
   ```

4. **Test endpoints**:
   ```bash
   npm test
   ```

## 🐛 Common Issues

### "OpenAI API key not found"
- Check that your API key is correct
- Ensure it starts with `sk-`
- Verify you have fine-tuning access

### "Supabase connection failed"
- Check your Supabase URL and key
- Ensure the database schema is created
- Verify your project is active

### "Google credentials not found"
- This is optional - you can skip for initial testing
- Ensure the credentials file path is correct
- Check that APIs are enabled in Google Cloud

## 🚀 Next Steps

Once your environment is configured:

1. **Follow the testing guide**: `TESTING-GUIDE.md`
2. **Create a Google Sheet**: Use `sample-google-sheet-template.md`
3. **Test the complete workflow**: Extract → Fine-tune → Deploy → Evaluate

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section in `README-AI-Model-Management.md`
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed: `npm install`
4. Check server logs for detailed error messages

Your system will be ready to extract content from Google Sheets and fine-tune AI models once these environment variables are configured!
