-- Consolidated Supabase Setup Script for Baruten Agric
-- Run this script in the Supabase SQL Editor to set up the complete database schema.

-- 1. Create Types
CREATE TYPE public.app_role AS ENUM ('general_admin', 'sub_admin');

-- 2. Create Tables

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  district TEXT CHECK (district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  district TEXT CHECK (district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  phone_number TEXT,
  nin TEXT,
  passport_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- INQUIRIES
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  crop TEXT NOT NULL,
  volume_mt INTEGER NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'fulfilled')),
  assigned_district TEXT CHECK (assigned_district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FARMERS
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  primary_crop TEXT NOT NULL,
  district TEXT NOT NULL CHECK (district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  nin TEXT,
  account_number TEXT,
  account_name TEXT,
  bank_name TEXT,
  passport_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- DISTRICT_ASSIGNMENTS
CREATE TABLE public.district_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district TEXT UNIQUE NOT NULL CHECK (district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  sub_admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sub_admin_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Functions & Triggers

-- Role Check Function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- District Check Function
CREATE OR REPLACE FUNCTION public.get_user_district(_user_id UUID)
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT district FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Drop trigger if exists to avoid error on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Policies

-- PROFILES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- USER_ROLES
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role during signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "General admins can insert roles for sub-admins" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'general_admin'));
CREATE POLICY "General admins can update sub-admin roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'general_admin')) WITH CHECK (public.has_role(auth.uid(), 'general_admin'));

-- INQUIRIES
CREATE POLICY "General admins can view all inquiries" ON public.inquiries FOR SELECT USING (public.has_role(auth.uid(), 'general_admin'));
CREATE POLICY "Sub-admins can view assigned inquiries" ON public.inquiries FOR SELECT USING (public.has_role(auth.uid(), 'sub_admin') AND assigned_district = public.get_user_district(auth.uid()));
CREATE POLICY "General admins can update inquiries" ON public.inquiries FOR UPDATE USING (public.has_role(auth.uid(), 'general_admin'));
CREATE POLICY "Anyone can submit inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

-- FARMERS
CREATE POLICY "General admins can view all farmers" ON public.farmers FOR SELECT USING (public.has_role(auth.uid(), 'general_admin'));
CREATE POLICY "Sub-admins can view farmers in their district" ON public.farmers FOR SELECT USING (public.has_role(auth.uid(), 'sub_admin') AND district = public.get_user_district(auth.uid()));
CREATE POLICY "General admins can insert farmers" ON public.farmers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'general_admin'));
CREATE POLICY "Sub-admins can insert farmers in their district" ON public.farmers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'sub_admin') AND district = public.get_user_district(auth.uid()));
CREATE POLICY "General admins can update farmers" ON public.farmers FOR UPDATE USING (public.has_role(auth.uid(), 'general_admin')) WITH CHECK (public.has_role(auth.uid(), 'general_admin'));
CREATE POLICY "Sub-admins can update farmers in their district" ON public.farmers FOR UPDATE USING (public.has_role(auth.uid(), 'sub_admin') AND district = public.get_user_district(auth.uid())) WITH CHECK (public.has_role(auth.uid(), 'sub_admin') AND district = public.get_user_district(auth.uid()));

-- DISTRICT_ASSIGNMENTS
CREATE POLICY "General admins can manage district assignments" ON public.district_assignments FOR ALL USING (public.has_role(auth.uid(), 'general_admin'));

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_farmers_verified ON public.farmers(verified);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON public.inquiries(assigned_to);

-- 7. Default Data
INSERT INTO public.district_assignments (district) VALUES
  ('Ilesha Baruba'),
  ('Gwanara'),
  ('Okuta'),
  ('Yashikira')
ON CONFLICT (district) DO NOTHING;

-- 8. Storage Buckets
-- Note: Requires permissions on storage schema
INSERT INTO storage.buckets (id, name, public) VALUES ('passports', 'passports', false) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can upload passports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'passports');
CREATE POLICY "Authenticated users can view passports" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'passports');
CREATE POLICY "Users can update their own passports" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'passports');
CREATE POLICY "Admins can delete passports" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'passports' AND public.has_role(auth.uid(), 'general_admin'));
