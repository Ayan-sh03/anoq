CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    family_name VARCHAR(255),
    given_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forms (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    slug VARCHAR(255) UNIQUE NOT NULL,
    author_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE multiple_choice_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'choice',
    choices JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_questions (
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (form_id, question_id)
);

CREATE TABLE form_choice_questions (
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    choice_question_id INTEGER REFERENCES multiple_choice_questions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (form_id, choice_question_id)
);

CREATE TABLE filled_forms (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255),
    user_ip VARCHAR(45),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE filled_form_answers (
    filled_form_id INTEGER REFERENCES filled_forms(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id),
    answer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (filled_form_id, question_id)
);

CREATE TABLE filled_form_choice_answers (
    filled_form_id INTEGER REFERENCES filled_forms(id) ON DELETE CASCADE,
    choice_question_id INTEGER REFERENCES multiple_choice_questions(id),
    selected_choices JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (filled_form_id, choice_question_id)
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
