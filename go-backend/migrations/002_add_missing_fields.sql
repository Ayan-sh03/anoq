-- Migration 002: Add missing fields and tables
-- Add password_hash field to users table
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- Create user_sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fix multiple_choice_questions table structure
-- First drop the existing table and recreate with proper structure
DROP TABLE IF EXISTS multiple_choice_questions;

CREATE TABLE multiple_choice_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
    choices JSONB NOT NULL DEFAULT '[]',
    selected_choice JSONB NOT NULL DEFAULT '[]',
    allow_multiple BOOLEAN NOT NULL DEFAULT false
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_multiple_choice_questions_question_id ON multiple_choice_questions(question_id);

