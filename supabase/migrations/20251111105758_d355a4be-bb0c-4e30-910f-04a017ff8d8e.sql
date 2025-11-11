-- Add new fields to user_roles table for sub-admins
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS nin text,
ADD COLUMN IF NOT EXISTS passport_url text;

-- Add new fields to farmers table
ALTER TABLE public.farmers
ADD COLUMN IF NOT EXISTS nin text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS account_name text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS passport_url text;

-- Create storage bucket for passports
INSERT INTO storage.buckets (id, name, public)
VALUES ('passports', 'passports', false)
ON CONFLICT (id) DO NOTHING;