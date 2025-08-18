const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.log('⚠️  Supabase not configured - model evaluation will be limited');
    supabase = null;
}

// Test cases for evaluation
const EVALUATION_TEST_CASES = [
  {
    id: 'financial_analysis',
    category: 'Financial',
    prompt: 'Analyze the key financial metrics from the latest quarterly report.',
    expected_keywords: ['revenue', 'profit', 'growth', 'quarterly', 'metrics']
  },
  {
    id: 'document_summary',
    category: 'Summarization',
    prompt: 'Provide a concise summary of the main points in the document.',
    expected_keywords: ['summary', 'main', 'points', 'document']
  },
  {
    id: 'business_insights',
    category: 'Business',
    prompt: 'What are the strategic implications of the market analysis?',
    expected_keywords: ['strategic', 'implications', 'market', 'analysis']
  },
  {
    id: 'technical_questions',
    category: 'Technical',
    prompt: 'Explain the technical architecture described in the document.',
    expected_keywords: ['technical', 'architecture', 'system', 'components']
  }
];

async function evaluateModel(modelName, testCases = EVALUATION_TEST_CASES) {
  try {
    const results = [];
    
    for (const testCase of testCases) {
      const startTime = Date.now();
      
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: "You are a helpful assistant with expertise in financial statements, business analysis, and technical documentation." },
          { role: "user", content: testCase.prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const content = response.choices[0].message.content;
      
      // Calculate metrics
      const metrics = calculateMetrics(content, testCase);
      
      results.push({
        testCaseId: testCase.id,
        category: testCase.category,
        prompt: testCase.prompt,
        response: content,
        responseTime: responseTime,
        metrics: metrics
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error evaluating model:', error);
    throw error;
  }
}

function calculateMetrics(content, testCase) {
  const metrics = {
    relevance_score: 0,
    keyword_coverage: 0,
    response_length: content.length,
    has_expected_keywords: false
  };
  
  // Check for expected keywords
  const foundKeywords = testCase.expected_keywords.filter(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  metrics.keyword_coverage = foundKeywords.length / testCase.expected_keywords.length;
  metrics.has_expected_keywords = foundKeywords.length > 0;
  
  // Simple relevance scoring based on keyword presence and response quality
  metrics.relevance_score = Math.min(1.0, metrics.keyword_coverage + (content.length > 50 ? 0.2 : 0));
  
  return metrics;
}

async function compareModels(modelNames) {
  try {
    const comparisonResults = {};
    
    for (const modelName of modelNames) {
      console.log(`Evaluating model: ${modelName}`);
      const results = await evaluateModel(modelName);
      comparisonResults[modelName] = results;
    }
    
    // Calculate aggregate metrics
    const aggregateMetrics = calculateAggregateMetrics(comparisonResults);
    
    return {
      individualResults: comparisonResults,
      aggregateMetrics: aggregateMetrics
    };
  } catch (error) {
    console.error('Error comparing models:', error);
    throw error;
  }
}

function calculateAggregateMetrics(comparisonResults) {
  const aggregateMetrics = {};
  
  for (const [modelName, results] of Object.entries(comparisonResults)) {
    const totalTests = results.length;
    const avgRelevanceScore = results.reduce((sum, result) => sum + result.metrics.relevance_score, 0) / totalTests;
    const avgKeywordCoverage = results.reduce((sum, result) => sum + result.metrics.keyword_coverage, 0) / totalTests;
    const avgResponseTime = results.reduce((sum, result) => sum + result.responseTime, 0) / totalTests;
    const avgResponseLength = results.reduce((sum, result) => sum + result.metrics.response_length, 0) / totalTests;
    
    aggregateMetrics[modelName] = {
      avgRelevanceScore,
      avgKeywordCoverage,
      avgResponseTime,
      avgResponseLength,
      totalTests
    };
  }
  
  return aggregateMetrics;
}

async function saveEvaluationResults(evaluationData, evaluationName = 'default') {
  try {
    const { data, error } = await supabase
      .from('model_evaluations')
      .insert([{
        evaluation_name: evaluationName,
        evaluation_data: evaluationData,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving evaluation results:', error);
    throw error;
  }
}

async function getEvaluationHistory() {
  try {
    const { data, error } = await supabase
      .from('model_evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching evaluation history:', error);
    throw error;
  }
}

async function runAutomatedEvaluation() {
  try {
    // Get all deployed models
    const { data: deployedModels, error } = await supabase
      .from('deployed_models')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    if (deployedModels.length === 0) {
      throw new Error('No deployed models found for evaluation');
    }

    const modelNames = deployedModels.map(model => model.model_name);
    
    // Add base model for comparison
    modelNames.push('gpt-4o');
    
    console.log('Running automated evaluation for models:', modelNames);
    
    const comparisonResults = await compareModels(modelNames);
    
    // Save results
    const evaluationName = `automated_evaluation_${Date.now()}`;
    await saveEvaluationResults(comparisonResults, evaluationName);
    
    return {
      success: true,
      evaluationName,
      results: comparisonResults
    };
    
  } catch (error) {
    console.error('Automated evaluation failed:', error);
    throw error;
  }
}

module.exports = {
  evaluateModel,
  compareModels,
  saveEvaluationResults,
  getEvaluationHistory,
  runAutomatedEvaluation,
  EVALUATION_TEST_CASES
};
