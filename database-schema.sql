-- Database schema for AI Model Management System

-- Table for storing extracted content from various sources
CREATE TABLE IF NOT EXISTS content_sources (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL, -- 'google_doc', 'google_sheet', 'pdf', 'text', etc.
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source_id VARCHAR(255), -- External ID (e.g., Google Doc ID)
    last_modified TIMESTAMP,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB -- Additional metadata (e.g., sheet data for Google Sheets)
);

-- Table for tracking fine-tuning jobs
CREATE TABLE IF NOT EXISTS fine_tune_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE NOT NULL, -- OpenAI job ID
    status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'succeeded', 'failed'
    model VARCHAR(100) NOT NULL, -- Base model used (e.g., 'gpt-3.5-turbo')
    training_file VARCHAR(255), -- OpenAI file ID
    fine_tuned_model VARCHAR(255), -- Resulting fine-tuned model name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    hyperparameters JSONB, -- Training hyperparameters
    result_files JSONB -- Training result files
);

-- Table for deployed models
CREATE TABLE IF NOT EXISTS deployed_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) UNIQUE NOT NULL, -- Fine-tuned model name
    job_id VARCHAR(255) REFERENCES fine_tune_jobs(job_id),
    base_model VARCHAR(100) NOT NULL, -- Original base model
    is_active BOOLEAN DEFAULT FALSE, -- Only one model can be active at a time
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    training_metrics JSONB, -- Training performance metrics
    hyperparameters JSONB, -- Model hyperparameters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for model evaluations
CREATE TABLE IF NOT EXISTS model_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_name VARCHAR(255) NOT NULL,
    evaluation_data JSONB NOT NULL, -- Complete evaluation results
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for chat sessions (existing - for reference)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for chat messages (existing - for reference)
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES chat_sessions(session_id),
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_sources_extracted_at ON content_sources(extracted_at);
CREATE INDEX IF NOT EXISTS idx_fine_tune_jobs_status ON fine_tune_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fine_tune_jobs_created_at ON fine_tune_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_deployed_models_active ON deployed_models(is_active);
CREATE INDEX IF NOT EXISTS idx_deployed_models_deployed_at ON deployed_models(deployed_at);
CREATE INDEX IF NOT EXISTS idx_model_evaluations_created_at ON model_evaluations(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Insert sample data for testing
INSERT INTO content_sources (source_type, title, content, source_id) VALUES
('sample', 'Sample Financial Report', 'This is a sample financial report containing quarterly earnings, revenue growth, and market analysis. The company showed strong performance with 15% revenue growth year-over-year.', 'sample-001'),
('sample', 'Business Strategy Document', 'Strategic planning document outlining market expansion plans, competitive analysis, and growth initiatives for the upcoming fiscal year.', 'sample-002')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE content_sources IS 'Stores extracted content from various sources for fine-tuning';
COMMENT ON TABLE fine_tune_jobs IS 'Tracks OpenAI fine-tuning jobs and their status';
COMMENT ON TABLE deployed_models IS 'Manages deployed fine-tuned models and their configurations';
COMMENT ON TABLE model_evaluations IS 'Stores evaluation results for comparing model performance';
