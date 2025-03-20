-- Create users table (required for foreign key relationships)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('GAS', 'FOOD', 'TRAVEL', 'OTHER')),
  location TEXT,
  vendor TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reports table for saved reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can only access their own data" ON public.users;
CREATE POLICY "Users can only access their own data"
  ON public.users
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can only access their own receipts" ON public.receipts;
CREATE POLICY "Users can only access their own receipts"
  ON public.receipts
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can only access their own reports" ON public.reports;
CREATE POLICY "Users can only access their own reports"
  ON public.reports
  USING (user_id = auth.uid());

-- Enable realtime for receipts
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
