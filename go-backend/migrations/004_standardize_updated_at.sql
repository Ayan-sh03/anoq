-- Migration 004: Standardize all timestamp columns to updated_at
-- Rename modified_at to updated_at in all tables for consistency

-- Rename in users table
ALTER TABLE users RENAME COLUMN modified_at TO updated_at;

-- Rename in forms table  
ALTER TABLE forms RENAME COLUMN modified_at TO updated_at;

-- Rename in filled_forms table
ALTER TABLE filled_forms RENAME COLUMN modified_at TO updated_at; 