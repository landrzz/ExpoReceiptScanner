-- Add a policy to allow access to the demo user's data without authentication
DROP POLICY IF EXISTS "Allow access to demo user data" ON public.receipts;
CREATE POLICY "Allow access to demo user data"
  ON public.receipts
  USING (user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Allow access to demo user" ON public.users;
CREATE POLICY "Allow access to demo user"
  ON public.users
  USING (id = '00000000-0000-0000-0000-000000000000');
