-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE form_status AS ENUM ('open', 'closed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    family_name VARCHAR(255),
    given_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forms table
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL DEFAULT '',
    slug VARCHAR(255) UNIQUE NOT NULL,
    status form_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'basic',
    position INTEGER NOT NULL DEFAULT 0,
    required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Multiple choice questions table
CREATE TABLE multiple_choice_questions (
    question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    choices JSONB NOT NULL DEFAULT '[]',
    selected_choice JSONB NOT NULL DEFAULT '[]',
    allow_multiple BOOLEAN NOT NULL DEFAULT false
);

-- Filled forms table (form submissions)
CREATE TABLE filled_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255),
    user_ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Filled form questions table (responses to individual questions)
CREATE TABLE filled_form_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filled_form_id UUID REFERENCES filled_forms(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT,
    selected_choices JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_forms_author_id ON forms(author_id);
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_questions_form_id ON questions(form_id);
CREATE INDEX idx_questions_position ON questions(form_id, position);
CREATE INDEX idx_filled_forms_form_id ON filled_forms(form_id);
CREATE INDEX idx_filled_forms_created_at ON filled_forms(created_at);
CREATE INDEX idx_filled_form_questions_filled_form_id ON filled_form_questions(filled_form_id);
CREATE INDEX idx_filled_form_questions_question_id ON filled_form_questions(question_id);
