# 🧪 Testing Guide: Google Sheets to Fine-tuned Model

This guide will walk you through testing the complete AI Model Management System using Google Sheets data for fine-tuning.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js installed (v14 or higher)
- [ ] Google Cloud project with Google Sheets API enabled
- [ ] Google service account credentials downloaded
- [ ] OpenAI API key with fine-tuning access
- [ ] Supabase project created
- [ ] All environment variables configured

## 🚀 Step 1: Initial Setup

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Run Setup Verification
```bash
npm run setup
```

This will check:
- ✅ Environment variables
- ✅ Google credentials
- ✅ Database connection
- ✅ OpenAI API access

### 1.3 Start the Server
```bash
npm start
```

The server should start on `http://localhost:3000`

## 📊 Step 2: Prepare Your Google Sheet

### 2.1 Create Test Data
Create a Google Sheet with sample data. Here's a recommended structure:

**Sheet 1: Financial Data**
```
Company Name | Revenue | Profit | Growth % | Quarter
Apple Inc    | 394.3B  | 96.9B  | 8.1%     | Q4 2023
Microsoft    | 211.9B  | 72.4B  | 7.4%     | Q4 2023
Google       | 307.4B  | 73.8B  | 5.0%     | Q4 2023
```

**Sheet 2: Business Analysis**
```
Metric          | Value    | Trend | Notes
Market Cap      | 2.8T     | Up    | Strong performance
R&D Investment  | 29.9B    | Up    | Innovation focus
Employee Count  | 164,000  | Up    | Growing workforce
```

**Sheet 3: Strategic Insights**
```
Insight Category | Key Finding | Impact | Recommendation
Market Position  | Industry leader | High | Maintain innovation
Financial Health | Strong cash flow | High | Continue investments
Competitive Edge | Technology advantage | Medium | Accelerate R&D
```

### 2.2 Make Sheet Accessible
1. Open your Google Sheet
2. Click "Share" in the top right
3. Add your service account email (from credentials) with "Viewer" access
4. Copy the sheet URL for later use

## 🔍 Step 3: Test Content Extraction

### 3.1 Access Admin Panel
Navigate to: `http://localhost:3000/admin`

### 3.2 Extract Google Sheet Content

**Method A: Smart Detection (Recommended)**
1. Go to "Content Extraction" tab
2. Paste your Google Sheet URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   ```
3. Click "Extract Content"
4. Verify success message

**Method B: Explicit Sheet Extraction**
1. Extract the Sheet ID from your URL
2. Use the "Quick Extract Options" section
3. Enter the Sheet ID in "Google Sheet ID" field
4. Click "Extract Sheet"

### 3.3 Verify Extraction
1. Click "Refresh Content"
2. You should see your sheet listed with:
   - ✅ Title of your spreadsheet
   - ✅ Type: "Google Sheet"
   - ✅ Sheet metadata (number of sheets, rows, columns)
   - ✅ Content preview

**Expected Output:**
```
Title: Your Spreadsheet Name
Type: Google Sheet
Sheets: 3 sheet(s)
  • Financial Data: 4 rows × 5 columns
  • Business Analysis: 4 rows × 4 columns
  • Strategic Insights: 4 rows × 4 columns
```

## 🎯 Step 4: Test Fine-tuning Process

### 4.1 Start Fine-tuning
1. Go to "Fine-tuning" tab
2. Click "Start Fine-tuning"
3. Wait for the process to complete

**What happens behind the scenes:**
- System collects all extracted content
- Creates training examples from your sheet data
- Uploads training file to OpenAI
- Starts fine-tuning job

### 4.2 Monitor Fine-tuning
1. Note the Job ID from the success message
2. Fine-tuning typically takes 1-4 hours
3. You can check status using the Job ID

**Expected Training Data Generated:**
```
Training Examples Created:
- Q&A pairs about financial metrics
- Summarization tasks for business data
- Analysis questions about strategic insights
- Cross-sheet relationship questions
```

## 🚀 Step 5: Test Model Deployment

### 5.1 Deploy Fine-tuned Model
1. Go to "Model Management" tab
2. Enter your completed Job ID
3. Click "Deploy Model"
4. Verify deployment success

### 5.2 Test the Fine-tuned Model
1. Select your deployed model from dropdown
2. Test with relevant questions:

**Sample Test Questions:**
```
"What are the key financial metrics for Apple Inc?"
"Summarize the business analysis findings"
"What strategic insights are most important?"
"Compare the performance of different companies"
"Explain the market position trends"
```

### 5.3 Compare Responses
Test the same questions with:
- Base model (GPT-4o)
- Your fine-tuned model

**Expected Improvements:**
- ✅ More accurate financial data references
- ✅ Better understanding of your specific business context
- ✅ Consistent terminology from your sheets
- ✅ Relevant insights based on your data

## 📈 Step 6: Test Model Evaluation

### 6.1 Run Automated Evaluation
1. Go to "Evaluation" tab
2. Click "Run Automated Evaluation"
3. Wait for evaluation to complete

### 6.2 Review Results
Compare metrics between:
- Base model (GPT-4o)
- Your fine-tuned model

**Key Metrics to Check:**
- **Relevance Score**: How well responses match your data
- **Keyword Coverage**: Use of terms from your sheets
- **Response Time**: Performance speed
- **Response Length**: Content completeness

### 6.3 Manual Comparison
1. Select both models in "Compare Specific Models"
2. Click "Compare Models"
3. Review detailed comparison

## 🔧 Step 7: Advanced Testing Scenarios

### 7.1 Test with Multiple Sheets
1. Extract content from multiple Google Sheets
2. Start fine-tuning with combined data
3. Compare results with single-sheet model

### 7.2 Test Different Data Types
Try sheets with:
- **Financial statements**
- **Market research data**
- **Product specifications**
- **Customer feedback**
- **Sales reports**

### 7.3 Test Edge Cases
- **Large sheets** (1000+ rows)
- **Multiple sheets** (10+ tabs)
- **Complex formulas** (results only)
- **Mixed data types** (text, numbers, dates)

## 🐛 Troubleshooting Common Issues

### Issue: "Google credentials not found"
**Solution:**
```bash
# Check your .env file
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json
```

### Issue: "Sheet not accessible"
**Solution:**
1. Share sheet with service account email
2. Ensure "Viewer" permissions
3. Check sheet URL is correct

### Issue: "Fine-tuning job failed"
**Solution:**
1. Check OpenAI API quota
2. Verify training data quality
3. Review OpenAI error messages in logs

### Issue: "Database connection error"
**Solution:**
1. Verify Supabase credentials
2. Run database schema: `database-schema.sql`
3. Check network connectivity

## 📊 Expected Results

### Content Extraction
- ✅ Sheet data extracted successfully
- ✅ Metadata preserved (sheets, rows, columns)
- ✅ Content formatted for training

### Fine-tuning
- ✅ Training data generated from sheet content
- ✅ Fine-tuning job completed successfully
- ✅ Model deployed and accessible

### Model Performance
- ✅ Better responses to domain-specific questions
- ✅ Accurate references to your data
- ✅ Improved relevance scores
- ✅ Consistent terminology

## 🎯 Success Criteria

Your test is successful when:
1. ✅ Google Sheet content extracted without errors
2. ✅ Fine-tuning job completes successfully
3. ✅ Fine-tuned model responds better than base model
4. ✅ Evaluation shows improved metrics
5. ✅ Model can answer questions about your specific data

## 📝 Test Report Template

After testing, document:

```
Test Date: [Date]
Google Sheet: [URL/Name]
Content Type: [Financial/Business/etc.]
Sheets Extracted: [Number]
Training Examples: [Number]
Fine-tuning Job ID: [ID]
Model Name: [Name]
Evaluation Results:
- Base Model Score: [X%]
- Fine-tuned Model Score: [Y%]
- Improvement: [Z%]
Key Findings: [Observations]
```

## 🚀 Next Steps

Once testing is complete:
1. **Scale up** with larger datasets
2. **Iterate** on training data quality
3. **Optimize** hyperparameters
4. **Deploy** to production
5. **Monitor** model performance

This testing guide ensures you can confidently use Google Sheets data to create effective fine-tuned models for your specific domain!
