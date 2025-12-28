-- Add verified column to farmers table for manual verification badge
ALTER TABLE public.farmers 
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Add assigned_to column to inquiries table to track who is responsible for each order
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS assigned_to text NULL;

-- Create index for faster lookups on verified farmers
CREATE INDEX IF NOT EXISTS idx_farmers_verified ON public.farmers(verified);

-- Create index for assigned_to lookups
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON public.inquiries(assigned_to);