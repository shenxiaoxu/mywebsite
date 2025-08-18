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
    console.log('⚠️  Supabase not configured - model deployment will be limited');
    supabase = null;
}

async function getDeployedModels() {
  try {
    const { data, error } = await supabase
      .from('deployed_models')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching deployed models:', error);
    throw error;
  }
}

async function deployFineTunedModel(jobId) {
  try {
    // Get fine-tune job details
    const job = await openai.fineTuning.jobs.retrieve(jobId);
    
    if (job.status !== 'succeeded') {
      throw new Error(`Fine-tune job ${jobId} is not completed. Current status: ${job.status}`);
    }

    const fineTunedModel = job.fine_tuned_model;
    
    // Save deployed model to database
    const { data, error } = await supabase
      .from('deployed_models')
      .insert([{
        model_name: fineTunedModel,
        job_id: jobId,
        base_model: job.model,
        is_active: true,
        deployed_at: new Date().toISOString(),
        training_metrics: job.result_files,
        hyperparameters: job.hyperparameters
      }]);

    if (error) throw error;

    return {
      success: true,
      modelName: fineTunedModel,
      jobId: jobId,
      deploymentId: data[0].id
    };

  } catch (error) {
    console.error('Error deploying fine-tuned model:', error);
    throw error;
  }
}

async function callFineTunedModel(modelName, messages, maxTokens = 1000, temperature = 0.7) {
  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    });

    return response;
  } catch (error) {
    console.error('Error calling fine-tuned model:', error);
    throw error;
  }
}

async function switchActiveModel(modelId) {
  try {
    // Deactivate all models
    await supabase
      .from('deployed_models')
      .update({ is_active: false })
      .eq('is_active', true);

    // Activate the specified model
    const { data, error } = await supabase
      .from('deployed_models')
      .update({ is_active: true })
      .eq('id', modelId)
      .select();

    if (error) throw error;

    return {
      success: true,
      activeModel: data[0]
    };

  } catch (error) {
    console.error('Error switching active model:', error);
    throw error;
  }
}

async function getActiveModel() {
  try {
    const { data, error } = await supabase
      .from('deployed_models')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting active model:', error);
    return null;
  }
}

async function deleteModel(modelId) {
  try {
    const { data, error } = await supabase
      .from('deployed_models')
      .delete()
      .eq('id', modelId)
      .select();

    if (error) throw error;

    return {
      success: true,
      deletedModel: data[0]
    };

  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
}

module.exports = {
  getDeployedModels,
  deployFineTunedModel,
  callFineTunedModel,
  switchActiveModel,
  getActiveModel,
  deleteModel
};
