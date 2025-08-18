# 📊 Sample Google Sheet Template for Testing

Create a new Google Sheet with the following structure to test the AI Model Management System.

## 🏗️ Sheet Structure

### Sheet 1: "Financial Data"
| Company Name | Revenue | Profit | Growth % | Quarter | Market Cap | Industry |
|--------------|---------|--------|----------|---------|------------|----------|
| Apple Inc    | 394.3B  | 96.9B  | 8.1%     | Q4 2023 | 2.8T       | Technology |
| Microsoft    | 211.9B  | 72.4B  | 7.4%     | Q4 2023 | 2.5T       | Technology |
| Google       | 307.4B  | 73.8B  | 5.0%     | Q4 2023 | 1.7T       | Technology |
| Amazon       | 514.0B  | 30.4B  | 9.0%     | Q4 2023 | 1.6T       | E-commerce |
| Tesla        | 96.8B   | 15.0B  | 18.8%    | Q4 2023 | 800B       | Automotive |

### Sheet 2: "Business Analysis"
| Metric          | Apple | Microsoft | Google | Amazon | Tesla | Notes |
|-----------------|-------|-----------|--------|--------|-------|-------|
| R&D Investment  | 29.9B | 25.0B     | 39.5B  | 73.2B  | 3.9B  | Innovation focus |
| Employee Count  | 164K  | 221K      | 156K   | 1.5M   | 127K  | Workforce size |
| Market Position | Leader| Strong    | Leader | Leader | Leader| Industry standing |
| Cash Reserves   | 166B  | 143B      | 119B   | 85B    | 29B   | Financial strength |
| Debt Level      | 95B   | 47B       | 12B    | 135B   | 2B    | Financial leverage |

### Sheet 3: "Strategic Insights"
| Insight Category | Key Finding | Impact | Recommendation | Priority |
|------------------|-------------|--------|----------------|----------|
| Market Position  | Industry leader in multiple segments | High | Maintain innovation pipeline | Critical |
| Financial Health | Strong cash flow and reserves | High | Continue strategic investments | High |
| Competitive Edge | Technology and ecosystem advantage | Medium | Accelerate R&D initiatives | Medium |
| Growth Strategy  | Diversification into new markets | High | Expand into emerging sectors | High |
| Risk Management  | Balanced portfolio approach | Medium | Monitor market volatility | Medium |

### Sheet 4: "Performance Metrics"
| Quarter | Revenue Growth | Profit Margin | Market Share | Customer Satisfaction | Innovation Score |
|---------|----------------|---------------|--------------|----------------------|------------------|
| Q1 2023 | 5.2%          | 24.5%        | 18.3%       | 4.6/5.0             | 8.7/10           |
| Q2 2023 | 6.8%          | 25.1%        | 19.1%       | 4.7/5.0             | 8.9/10           |
| Q3 2023 | 7.3%          | 25.8%        | 19.8%       | 4.8/5.0             | 9.1/10           |
| Q4 2023 | 8.1%          | 24.6%        | 20.2%       | 4.9/5.0             | 9.3/10           |

### Sheet 5: "Market Trends"
| Trend Category | Current Trend | Forecast | Confidence | Action Required |
|----------------|---------------|----------|------------|-----------------|
| AI/ML Adoption | Accelerating  | High     | 95%        | Increase investment |
| Cloud Services | Growing       | High     | 90%        | Expand offerings |
| Mobile Market  | Stable        | Medium   | 75%        | Maintain position |
| Sustainability | Increasing    | High     | 85%        | Develop initiatives |
| Cybersecurity  | Critical      | High     | 95%        | Strengthen defenses |

## 🔧 Setup Instructions

### 1. Create the Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "AI Model Testing Data"
4. Create 5 sheets with the names above

### 2. Copy the Data
1. Copy each table above
2. Paste into the corresponding sheet
3. Format as needed (headers, colors, etc.)

### 3. Share the Sheet
1. Click "Share" in the top right
2. Add your service account email with "Viewer" access
3. Copy the sheet URL

### 4. Test Extraction
1. Start your server: `npm start`
2. Go to: `http://localhost:3000/admin`
3. Paste the sheet URL in the extraction field
4. Click "Extract Content"

## 🎯 Expected Results

After extraction, you should see:
- ✅ **Title**: "AI Model Testing Data"
- ✅ **Type**: "Google Sheet"
- ✅ **Sheets**: 5 sheet(s)
- ✅ **Content**: All data from all sheets
- ✅ **Metadata**: Sheet structure information

## 🧪 Test Questions

Once fine-tuned, test your model with:

### Financial Questions
- "What is Apple's revenue and profit for Q4 2023?"
- "Which company has the highest growth rate?"
- "Compare the financial performance of Apple and Microsoft"

### Business Analysis Questions
- "What are the key business metrics for Google?"
- "Which company has the highest R&D investment?"
- "Analyze the market position of these companies"

### Strategic Questions
- "What are the most important strategic insights?"
- "What recommendations have high priority?"
- "How has performance changed over the quarters?"

### Market Questions
- "What are the current market trends?"
- "Which trends have the highest confidence?"
- "What actions are required for AI/ML adoption?"

## 📈 Success Metrics

Your fine-tuned model should:
- ✅ **Accurately reference** specific numbers from your sheets
- ✅ **Understand relationships** between different metrics
- ✅ **Provide insights** based on your data structure
- ✅ **Use consistent terminology** from your sheets
- ✅ **Answer domain-specific** questions better than the base model

## 🔄 Iteration Tips

1. **Start Simple**: Use this template first
2. **Add Complexity**: Gradually add more sheets and data
3. **Test Variations**: Try different data types and structures
4. **Measure Performance**: Compare before/after fine-tuning
5. **Refine Data**: Improve data quality based on results

This template provides a comprehensive test dataset that covers financial, business, strategic, and market data - perfect for testing the full capabilities of your AI Model Management System!
