-- Create storage bucket for venue images if it doesn't exist
-- Note: This must be run as a Supabase admin (in the SQL editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-images', 
  'venue-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage bucket
UPDATE storage.buckets SET public = true WHERE id = 'venue-images';

-- Create storage policies for venue images
CREATE POLICY "Anyone can view venue images"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-images');

CREATE POLICY "Authenticated users can upload venue images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own venue images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'venue-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own venue images"
ON storage.objects FOR DELETE
USING (bucket_id = 'venue-images' AND auth.uid()::text = (storage.foldername(name))[1]);