-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  district TEXT CHECK (district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('general_admin', 'sub_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  district TEXT CHECK (district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's district
CREATE OR REPLACE FUNCTION public.get_user_district(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT district
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create inquiries table (for orders from contact form)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Inquiries policies
CREATE POLICY "General admins can view all inquiries"
  ON public.inquiries FOR SELECT
  USING (public.has_role(auth.uid(), 'general_admin'));

CREATE POLICY "Sub-admins can view assigned inquiries"
  ON public.inquiries FOR SELECT
  USING (
    public.has_role(auth.uid(), 'sub_admin') 
    AND assigned_district = public.get_user_district(auth.uid())
  );

CREATE POLICY "General admins can update inquiries"
  ON public.inquiries FOR UPDATE
  USING (public.has_role(auth.uid(), 'general_admin'));

-- Create farmers table
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  primary_crop TEXT NOT NULL,
  district TEXT NOT NULL CHECK (district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on farmers
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

-- Farmers policies
CREATE POLICY "General admins can view all farmers"
  ON public.farmers FOR SELECT
  USING (public.has_role(auth.uid(), 'general_admin'));

CREATE POLICY "Sub-admins can view farmers in their district"
  ON public.farmers FOR SELECT
  USING (
    public.has_role(auth.uid(), 'sub_admin')
    AND district = public.get_user_district(auth.uid())
  );

CREATE POLICY "General admins can insert farmers"
  ON public.farmers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'general_admin'));

CREATE POLICY "Sub-admins can insert farmers in their district"
  ON public.farmers FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'sub_admin')
    AND district = public.get_user_district(auth.uid())
  );

-- Create district_assignments table (for Tab 3)
CREATE TABLE public.district_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district TEXT UNIQUE NOT NULL CHECK (district IN ('Ilesha Baruba', 'Gwanara', 'Okuta', 'Yashikira')),
  sub_admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sub_admin_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on district_assignments
ALTER TABLE public.district_assignments ENABLE ROW LEVEL SECURITY;

-- District assignments policies (General admin only)
CREATE POLICY "General admins can manage district assignments"
  ON public.district_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'general_admin'));

-- Insert default districts
INSERT INTO public.district_assignments (district) VALUES
  ('Ilesha Baruba'),
  ('Gwanara'),
  ('Okuta'),
  ('Yashikira');

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();