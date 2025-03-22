-- This script sets up the necessary storage bucket and permissions for the receipt_images bucket

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipt_images', 'receipt_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to all objects in the bucket
CREATE POLICY "Allow public access to receipt_images" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'receipt_images');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload receipts" 
ON storage.objects FOR INSERT 
TO authenticated 
USING (bucket_id = 'receipt_images');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update receipts" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'receipt_images');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete receipts" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'receipt_images');

-- Special policy for the demo user
CREATE POLICY "Allow demo user access to receipts" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'receipt_images' AND auth.uid()::text = '00000000-0000-0000-0000-000000000000');

-- Make sure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
