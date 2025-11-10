-- Allow users to insert their own role during signup
-- This is needed for the auto-assignment during registration
CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow general admins to insert roles for other users (for district management)
CREATE POLICY "General admins can insert roles for sub-admins"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'general_admin'::app_role)
);

-- Allow general admins to update roles for sub-admins
CREATE POLICY "General admins can update sub-admin roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'general_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'general_admin'::app_role));