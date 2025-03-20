-- Insert a demo user for testing purposes
INSERT INTO auth.users (id, email, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'demo@example.com', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert the same user into the public.users table
INSERT INTO public.users (id, email, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'demo@example.com', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert some sample receipts for the demo user
INSERT INTO public.receipts (id, user_id, date, time, amount, category, location, vendor, notes, image_url, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '2023-10-15', '12:30', 24.99, 'FOOD', 'New York, NY', 'Burger King', 'Lunch with team', 'https://images.unsplash.com/photo-1572441420532-e7f6e24e1848?w=400&q=80', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '2023-10-12', '10:15', 45.50, 'GAS', 'Boston, MA', 'Shell', 'Full tank', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '2023-10-10', '08:45', 125.00, 'TRAVEL', 'Chicago, IL', 'Uber', 'Airport trip', 'https://images.unsplash.com/photo-1595953832255-a2ba391cdc78?w=400&q=80', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '2023-10-05', '14:20', 75.25, 'OTHER', 'San Francisco, CA', 'Office Depot', 'Supplies', 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '2023-10-01', '19:30', 32.50, 'FOOD', 'Los Angeles, CA', 'Chipotle', 'Dinner', 'https://images.unsplash.com/photo-1593538312308-d4c29d8dc7f1?w=400&q=80', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '2023-09-28', '16:45', 42.75, 'GAS', 'Seattle, WA', 'Exxon', NULL, 'https://images.unsplash.com/photo-1605849285614-e5884d961a49?w=400&q=80', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '2023-09-25', '11:10', 350.00, 'TRAVEL', 'Denver, CO', 'Delta', 'Baggage fee', 'https://images.unsplash.com/photo-1647427060118-4911c9821b82?w=400&q=80', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '2023-09-20', '13:25', 18.99, 'FOOD', 'Miami, FL', 'Subway', 'Lunch', 'https://images.unsplash.com/photo-1567360425618-1594206637d2?w=400&q=80', now(), now());
