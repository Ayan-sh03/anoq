-- Migration 003: Fix multiple choice questions table structure
-- Remove selected_choice field from multiple_choice_questions as it belongs in responses, not question definitions

-- Drop and recreate the multiple_choice_questions table without selected_choice
DROP TABLE IF EXISTS multiple_choice_questions CASCADE;

CREATE TABLE multiple_choice_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    choices JSONB NOT NULL DEFAULT '[]',
    allow_multiple BOOLEAN NOT NULL DEFAULT false
);

-- Recreate the index
CREATE INDEX idx_multiple_choice_questions_question_id ON multiple_choice_questions(question_id); 