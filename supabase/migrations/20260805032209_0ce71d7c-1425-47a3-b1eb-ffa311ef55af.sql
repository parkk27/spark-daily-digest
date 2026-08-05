DROP POLICY "Admins read events" ON public.analytics_events;
CREATE POLICY "Admins read events" ON public.analytics_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));