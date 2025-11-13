-- Fix RLS policies for cross-device booking visibility
-- ISSUE FOUND: "Users can read own bookings" policy is restricting access
-- SOLUTION: Drop the conflicting restrictive policy

-- Drop the conflicting restrictive SELECT policy on bookings table
DROP POLICY IF EXISTS "Users can read own bookings" ON public.bookings;

-- Drop the conflicting restrictive SELECT policy on booking_participants table  
DROP POLICY IF EXISTS "Users can view their booking participants" ON public.booking_participants;

-- Verify the policies after cleanup
-- You should now ONLY have:
-- - "Enable read access for all authenticated users" (for both tables)
-- - "Venue owners can read bookings for their venues" (for bookings)
-- - INSERT/UPDATE policies (those are fine)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_participants')
ORDER BY tablename, policyname;
