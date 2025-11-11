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

-- Storage policies for passports
CREATE POLICY "Authenticated users can upload passports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'passports');

CREATE POLICY "Authenticated users can view passports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'passports');

CREATE POLICY "Users can update their own passports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'passports');

CREATE POLICY "Admins can delete passports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'passports' AND
  has_role(auth.uid(), 'general_admin'::app_role)
);