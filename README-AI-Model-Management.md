# AI Model Management System

A comprehensive system for extracting content from Google Docs, fine-tuning AI models, deploying them, and evaluating their performance.

## Features

### 1. Content Extraction
- Extract content from Google Docs using Google Docs API
- Extract content from Google Sheets using Google Sheets API
- Store extracted content in database for fine-tuning
- Support for multiple content sources

### 2. Fine-tuning Pipeline
- Automatically prepare training data from extracted content
- Create and manage OpenAI fine-tuning jobs
- Track fine-tuning progress and results

### 3. Model Deployment
- Deploy fine-tuned models to production
- Switch between different model versions
- Test fine-tuned models with custom prompts

### 4. Model Evaluation
- Automated evaluation using standardized test cases
- Compare multiple model versions
- Track evaluation history and performance metrics

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database (Supabase recommended)
- OpenAI API key
- Google Cloud credentials (for Google Docs API)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file with the following variables:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Cloud (for Google Docs API)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json

# Server
PORT=3000
NODE_ENV=development
```

### 3. Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Docs API and Google Sheets API
4. Create a service account
5. Download the JSON credentials file
6. Set the path in `GOOGLE_APPLICATION_CREDENTIALS`

### 4. Database Setup
1. Create a Supabase project
2. Run the SQL schema from `database-schema.sql`
3. Update your `.env` file with Supabase credentials

### 5. Start the Server
```bash
npm start
```

## Usage Guide

### Access the Admin Panel
Navigate to `http://localhost:3000/admin` to access the admin interface.

### 1. Content Extraction

#### Extract from Google Docs & Sheets
1. Go to the "Content Extraction" tab
2. Enter the Google Doc/Sheet URL or ID:
   - **Google Doc URL**: `https://docs.google.com/document/d/DOC_ID/edit`
   - **Google Sheet URL**: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - **Just ID**: `DOC_ID` (defaults to Google Doc)
   - **Prefixed ID**: `sheet:SHEET_ID` (explicitly specify as Sheet)
3. Click "Extract Content"
4. The content will be saved to the database

#### View Extracted Content
- Click "Refresh Content" to see all extracted content
- Each content item shows title, type, extraction date, and preview

### 2. Fine-tuning

#### Start Fine-tuning Process
1. Go to the "Fine-tuning" tab
2. Click "Start Fine-tuning"
3. The system will:
   - Collect all extracted content
   - Prepare training data with question-answer pairs
   - Upload training file to OpenAI
   - Start fine-tuning job
4. Note the Job ID for tracking

#### Monitor Fine-tuning
- Fine-tuning jobs typically take 1-4 hours
- Check status using the Job ID
- Jobs will show as "succeeded" when complete

### 3. Model Deployment

#### Deploy Fine-tuned Model
1. Go to the "Model Management" tab
2. Enter the completed Job ID
3. Click "Deploy Model"
4. The model will be available for use

#### Manage Models
- View all deployed models
- Switch between active models
- Test models with custom prompts

### 4. Model Evaluation

#### Run Automated Evaluation
1. Go to the "Evaluation" tab
2. Click "Run Automated Evaluation"
3. System will compare all deployed models against base model
4. Results show relevance, keyword coverage, response time, and length

#### Compare Specific Models
1. Select multiple models from dropdown
2. Click "Compare Models"
3. View detailed comparison metrics

## API Endpoints

### Content Extraction
- `POST /api/extract/google-content` - Extract content from Google Doc or Sheet (auto-detects type)
- `POST /api/extract/google-doc` - Extract content from Google Doc
- `POST /api/extract/google-sheet` - Extract content from Google Sheet
- `GET /api/content` - Get all extracted content

### Fine-tuning
- `POST /api/fine-tune/start` - Start fine-tuning process
- `GET /api/fine-tune/status/:jobId` - Get fine-tuning status

### Model Management
- `POST /api/deploy/model` - Deploy fine-tuned model
- `GET /api/models` - Get deployed models
- `POST /api/models/switch` - Switch active model
- `POST /api/chat/fine-tuned` - Chat with fine-tuned model

### Evaluation
- `POST /api/evaluate/automated` - Run automated evaluation
- `POST /api/evaluate/compare` - Compare specific models
- `GET /api/evaluate/history` - Get evaluation history

## Database Schema

### Tables
- `content_sources` - Extracted content from various sources
- `fine_tune_jobs` - OpenAI fine-tuning job tracking
- `deployed_models` - Deployed fine-tuned models
- `model_evaluations` - Evaluation results and history
- `chat_sessions` - Chat session tracking
- `chat_messages` - Individual chat messages

## Customization

### Training Data Preparation
Modify `prepareTrainingData()` in `api/fine-tuner.js` to customize how content is converted to training examples.

### Evaluation Test Cases
Add or modify test cases in `EVALUATION_TEST_CASES` in `api/model-evaluator.js`.

### Model Hyperparameters
Adjust fine-tuning parameters in `createFineTuneJob()` in `api/fine-tuner.js`.

## Troubleshooting

### Common Issues

1. **Google Docs API Error**
   - Verify Google Cloud credentials
   - Check if Google Docs API is enabled
   - Ensure document is accessible

2. **OpenAI API Error**
   - Verify OpenAI API key
   - Check API quota and billing
   - Ensure fine-tuning is enabled for your account

3. **Database Connection Error**
   - Verify Supabase credentials
   - Check if database schema is created
   - Ensure network connectivity

4. **Fine-tuning Job Fails**
   - Check training data quality
   - Verify file format (JSONL)
   - Review OpenAI error messages

### Logs
Check server logs for detailed error information:
```bash
npm run dev  # For development with detailed logging
```

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Google Credentials**: Keep service account credentials secure
3. **Database Access**: Use environment variables for database credentials
4. **Admin Access**: Consider adding authentication to admin panel

## Performance Optimization

1. **Content Processing**: Implement content chunking for large documents
2. **Training Data**: Optimize training data preparation for better model performance
3. **Caching**: Add caching for frequently accessed data
4. **Database Indexing**: Ensure proper database indexes for performance

## Future Enhancements

1. **Additional Content Sources**: PDF, Word documents, web scraping
2. **Advanced Evaluation**: Human evaluation, A/B testing
3. **Model Versioning**: Automatic model version management
4. **Real-time Monitoring**: Live model performance monitoring
5. **Multi-language Support**: Support for multiple languages
6. **Custom Metrics**: Domain-specific evaluation metrics

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed

## License

MIT License - see LICENSE file for details.
