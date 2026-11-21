-- Install with psql -X -v ON_ERROR_STOP=1 -f server/migrations/schema.sql.
-- One transaction covers both fresh installs and upgrades of the integer-ID schema.
BEGIN;
SET LOCAL search_path TO public;
SELECT pg_advisory_xact_lock(hashtextextended('anoq.schema', 0));

DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        RAISE EXCEPTION 'Existing public.users is incompatible with the Anoq integer-ID schema'
            USING HINT = 'Install in a separate empty PostgreSQL database to preserve existing records.';
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE,
    family_name VARCHAR(255),
    given_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ai_request_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS web_sessions (
    token_hash BYTEA PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS web_sessions_expires_at_idx ON web_sessions(expires_at);
CREATE INDEX IF NOT EXISTS web_sessions_user_idx ON web_sessions(user_id);

CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    slug VARCHAR(255) UNIQUE NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS forms_author_created_idx ON forms(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'basic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS multiple_choice_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'choice',
    choices JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(choices) = 'array'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS form_questions (
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (form_id, question_id)
);

CREATE TABLE IF NOT EXISTS form_choice_questions (
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    choice_question_id INTEGER REFERENCES multiple_choice_questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (form_id, choice_question_id)
);

-- Older memberships were displayed in question-ID order. Keep that order before
-- the editor starts saving explicit zero-based positions.
ALTER TABLE form_questions ADD COLUMN IF NOT EXISTS position INTEGER;
WITH ordered AS (
    SELECT form_id, question_id, row_number() OVER (PARTITION BY form_id ORDER BY question_id) - 1 AS ordinal
    FROM form_questions
)
UPDATE form_questions m SET position = ordered.ordinal
FROM ordered WHERE m.position IS NULL AND (m.form_id, m.question_id) = (ordered.form_id, ordered.question_id);
ALTER TABLE form_questions ALTER COLUMN position SET DEFAULT 0, ALTER COLUMN position SET NOT NULL;

ALTER TABLE form_choice_questions ADD COLUMN IF NOT EXISTS position INTEGER;
WITH ordered AS (
    SELECT form_id, choice_question_id, row_number() OVER (PARTITION BY form_id ORDER BY choice_question_id) - 1 AS ordinal
    FROM form_choice_questions
)
UPDATE form_choice_questions m SET position = ordered.ordinal
FROM ordered WHERE m.position IS NULL AND (m.form_id, m.choice_question_id) = (ordered.form_id, ordered.choice_question_id);
ALTER TABLE form_choice_questions ALTER COLUMN position SET DEFAULT 0, ALTER COLUMN position SET NOT NULL;

CREATE TABLE IF NOT EXISTS filled_forms (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE filled_forms ADD COLUMN IF NOT EXISTS receipt_hash BYTEA;
CREATE UNIQUE INDEX IF NOT EXISTS filled_forms_receipt_idx ON filled_forms(form_id, receipt_hash);
CREATE INDEX IF NOT EXISTS filled_forms_submitted_idx ON filled_forms(form_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS filled_form_answers (
    filled_form_id INTEGER REFERENCES filled_forms(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE RESTRICT,
    answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (filled_form_id, question_id)
);
ALTER TABLE filled_form_answers ADD COLUMN IF NOT EXISTS question_text TEXT;
-- A NULL position preserves the historical ID ordering for pre-snapshot replies.
ALTER TABLE filled_form_answers ADD COLUMN IF NOT EXISTS position INTEGER;

CREATE TABLE IF NOT EXISTS filled_form_choice_answers (
    filled_form_id INTEGER REFERENCES filled_forms(id) ON DELETE CASCADE,
    choice_question_id INTEGER REFERENCES multiple_choice_questions(id) ON DELETE RESTRICT,
    selected_choices JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(selected_choices) = 'array'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (filled_form_id, choice_question_id)
);
ALTER TABLE filled_form_choice_answers ADD COLUMN IF NOT EXISTS question_text TEXT;
ALTER TABLE filled_form_choice_answers ADD COLUMN IF NOT EXISTS position INTEGER;

-- Capture prompt text for responses submitted before snapshots were introduced.
UPDATE filled_form_answers a SET question_text = q.question_text
FROM questions q WHERE a.question_id = q.id AND a.question_text IS NULL;
UPDATE filled_form_choice_answers a SET question_text = q.question_text
FROM multiple_choice_questions q WHERE a.choice_question_id = q.id AND a.question_text IS NULL;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    -- Each committed edit needs a distinct version, including writers that waited for a lock.
    NEW.updated_at = GREATEST(clock_timestamp(), OLD.updated_at + INTERVAL '1 microsecond');
    RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
