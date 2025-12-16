-- ========================================
-- FIX: Update trigger function to bypass RLS
-- ========================================
-- This fixes the "new row violates row-level security policy" error
-- when accepting join requests

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_join_request_status_change ON public.join_requests;
DROP FUNCTION IF EXISTS handle_join_request_accepted();

-- Recreate function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION handle_join_request_accepted()
RETURNS TRIGGER 
SECURITY DEFINER  -- This allows the function to bypass RLS policies
SET search_path = public
AS $$
BEGIN
  -- When a join request is accepted, add user to booking_participants
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Check if not already a participant
    IF NOT EXISTS (
      SELECT 1 FROM public.booking_participants 
      WHERE booking_id = NEW.booking_id AND user_id = NEW.requester_id
    ) THEN
      -- Add to participants
      INSERT INTO public.booking_participants (booking_id, user_id, status)
      VALUES (NEW.booking_id, NEW.requester_id, 'confirmed');
      
      -- Decrement player_count in bookings
      UPDATE public.bookings 
      SET player_count = GREATEST(player_count - 1, 0)
      WHERE id = NEW.booking_id;
      
      -- Create notification for requester
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        NEW.requester_id,
        'join_request_accepted',
        'Join Request Accepted!',
        'Your request to join the game has been accepted.'
      );
    END IF;
  END IF;
  
  -- When rejected, notify the requester
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.requester_id,
      'join_request_rejected',
      'Join Request Rejected',
      'Your request to join the game has been declined.'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_join_request_status_change
  AFTER UPDATE ON public.join_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_join_request_accepted();

-- ========================================
-- Also update the auto-reject trigger function
-- ========================================
DROP TRIGGER IF EXISTS on_booking_full_auto_reject ON public.bookings;
DROP FUNCTION IF EXISTS auto_reject_join_requests_when_full();

CREATE OR REPLACE FUNCTION auto_reject_join_requests_when_full()
RETURNS TRIGGER
SECURITY DEFINER  -- Bypass RLS
SET search_path = public
AS $$
BEGIN
  -- When player_count becomes 0, auto-reject all pending requests
  IF NEW.player_count = 0 AND OLD.player_count > 0 THEN
    -- Update all pending requests to rejected
    UPDATE public.join_requests
    SET status = 'rejected'
    WHERE booking_id = NEW.id AND status = 'pending';
    
    -- Create notifications for all rejected requesters
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT 
      requester_id,
      'join_request_auto_rejected',
      'Game Full', 
      'The game is now full. Your join request has been automatically declined.'
    FROM public.join_requests
    WHERE booking_id = NEW.id AND status = 'rejected' AND responded_at >= NOW() - INTERVAL '1 second';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_booking_full_auto_reject
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.player_count = 0 AND OLD.player_count > 0)
  EXECUTE FUNCTION auto_reject_join_requests_when_full();

-- ========================================
-- Grant necessary permissions
-- ========================================
-- Ensure authenticated users can insert into booking_participants (through triggers)
GRANT INSERT ON public.booking_participants TO authenticated;
GRANT UPDATE ON public.bookings TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
