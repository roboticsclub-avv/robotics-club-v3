-- ============================================================
-- V3: Settings Table Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/eeseizfyjbuleedynhlx/sql
-- ============================================================

-- Create the settings table (key-value store for site configuration)
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT 'false'::jsonb,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Disable RLS (admin-only table accessed via API routes in V3)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Insert the default recruitment status setting
INSERT INTO settings (id, value)
VALUES ('is_recruiting', 'true'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NOTE: The settings table already exists in this project.
-- This file is for documentation / disaster recovery only.
-- Current state: is_recruiting = false
-- ============================================================
