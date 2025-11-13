-- Create user_ratings table to track player ratings
-- Run this in your Supabase SQL Editor

-- Create user_ratings table
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate ratings (one user can only rate another once)
  UNIQUE(rater_user_id, rated_user_id),
  
  -- Prevent self-rating
  CHECK (rater_user_id != rated_user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater ON public.user_ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated ON public.user_ratings(rated_user_id);

-- Enable RLS
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_ratings
CREATE POLICY "Users can insert their own ratings"
  ON public.user_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rater_user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.user_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = rater_user_id);

CREATE POLICY "Users can view all ratings"
  ON public.user_ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE public.user_ratings IS 'Stores ratings between users after playing together';

COMMENT ON COLUMN public.user_ratings.rater_user_id IS 'User who is giving the rating';
COMMENT ON COLUMN public.user_ratings.rated_user_id IS 'User who is being rated';
COMMENT ON COLUMN public.user_ratings.rating IS 'Rating value from 1-5 stars';
