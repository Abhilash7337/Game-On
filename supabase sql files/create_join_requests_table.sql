-- ========================================
-- JOIN REQUESTS TABLE
-- ========================================
-- This table manages join requests for open games
-- Person B sends request to Person A (host) to join their game

CREATE TABLE IF NOT EXISTS public.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  
  -- Prevent duplicate requests for same booking by same user
  UNIQUE(booking_id, requester_id)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_join_requests_booking_id ON public.join_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester_id ON public.join_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_host_id ON public.join_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.join_requests(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_created_at ON public.join_requests(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests (as requester or host)
CREATE POLICY "Users can view their own join requests"
  ON public.join_requests
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = host_id);

-- Policy: Users can create join requests
CREATE POLICY "Users can create join requests"
  ON public.join_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Policy: Hosts can update requests (accept/reject)
CREATE POLICY "Hosts can update join requests"
  ON public.join_requests
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Policy: Requesters can cancel their own requests
CREATE POLICY "Requesters can cancel their own requests"
  ON public.join_requests
  FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (auth.uid() = requester_id AND status = 'cancelled');

-- ========================================
-- TRIGGER: Update updated_at on modification
-- ========================================
CREATE OR REPLACE FUNCTION update_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status != OLD.status THEN
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_join_requests
  BEFORE UPDATE ON public.join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_join_requests_updated_at();

-- ========================================
-- TRIGGER: Auto-add to booking_participants on acceptance
-- ========================================
CREATE OR REPLACE FUNCTION handle_join_request_accepted()
RETURNS TRIGGER AS $$
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

CREATE TRIGGER on_join_request_status_change
  AFTER UPDATE ON public.join_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_join_request_accepted();

-- ========================================
-- TRIGGER: Auto-reject pending requests when game is full
-- ========================================
CREATE OR REPLACE FUNCTION auto_reject_requests_when_full()
RETURNS TRIGGER AS $$
BEGIN
  -- When player_count becomes 0, auto-reject all pending requests
  IF NEW.player_count = 0 AND OLD.player_count > 0 THEN
    UPDATE public.join_requests
    SET status = 'rejected',
        responded_at = now()
    WHERE booking_id = NEW.id 
      AND status = 'pending';
    
    -- Notify all rejected requesters
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT 
      requester_id,
      'join_request_auto_rejected',
      'Game Full',
      'The game is now full. Your join request has been automatically declined.'
    FROM public.join_requests
    WHERE booking_id = NEW.id 
      AND status = 'rejected'
      AND responded_at >= now() - interval '5 seconds'; -- Only just-rejected ones
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_reject_on_game_full
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.player_count = 0 AND OLD.player_count > 0)
  EXECUTE FUNCTION auto_reject_requests_when_full();

-- ========================================
-- ENABLE REALTIME
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify the setup:

-- Check table exists
-- SELECT * FROM public.join_requests LIMIT 1;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'join_requests';

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'join_requests';

-- Check triggers
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.join_requests'::regclass;
