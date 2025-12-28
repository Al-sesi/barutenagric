-- Allow general admins to update farmers (for verification toggle)
CREATE POLICY "General admins can update farmers" 
ON public.farmers 
FOR UPDATE 
USING (has_role(auth.uid(), 'general_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'general_admin'::app_role));

-- Allow sub-admins to update farmers in their district
CREATE POLICY "Sub-admins can update farmers in their district" 
ON public.farmers 
FOR UPDATE 
USING (has_role(auth.uid(), 'sub_admin'::app_role) AND (district = get_user_district(auth.uid())))
WITH CHECK (has_role(auth.uid(), 'sub_admin'::app_role) AND (district = get_user_district(auth.uid())));