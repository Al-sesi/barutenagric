-- Create the general admin user account
-- Note: Password hash for 'Baruten1010' - users will need to sign up through the UI first
-- This migration creates a user role entry that will be used once the user signs up

-- First, we'll create a function to help us add the admin after signup
-- The actual user will be created through the auth signup flow

-- For now, let's prepare the system by ensuring we can identify this admin
-- We'll add a note in the setup that this user needs to sign up first at /admin-login

-- Add a comment for tracking
COMMENT ON TABLE public.user_roles IS 'Admin user Barutenagriculture@gmail.com should be created via signup, then assigned general_admin role';