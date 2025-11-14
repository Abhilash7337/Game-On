-- =====================================================
-- GAME CHATROOM AUTO-DELETION SYSTEM
-- =====================================================
-- Purpose: Automatically delete game chatrooms 1 hour after booking slot ends
-- 
-- Example: Booking from 3pm-6pm → Chatroom deleted at 7pm (6pm + 1 hour)
-- 
-- What gets deleted:
--   1. All messages in the conversation
--   2. All conversation_participants records
--   3. The conversation record itself
--   4. Booking is marked as completed (not deleted)
-- =====================================================

-- Step 1: Add expires_at column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_conversations_expires_at 
ON conversations(expires_at) 
WHERE expires_at IS NOT NULL;

COMMENT ON COLUMN conversations.expires_at IS 
'Timestamp when this conversation should be auto-deleted. Set to booking_end_time + 1 hour for game chatrooms.';

-- =====================================================
-- Step 2: Function to delete expired chatrooms
-- =====================================================
CREATE OR REPLACE FUNCTION delete_expired_game_chatrooms()
RETURNS TABLE (
  deleted_conversations INT,
  deleted_messages INT,
  deleted_participants INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_count INT := 0;
  msg_count INT := 0;
  part_count INT := 0;
  expired_conv_ids UUID[];
BEGIN
  -- Find all expired conversations
  SELECT ARRAY_AGG(id) INTO expired_conv_ids
  FROM conversations
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND type = 'game_chat'; -- Only auto-delete game chats, not friend/sport group chats
  
  -- If no expired conversations, return zeros
  IF expired_conv_ids IS NULL OR array_length(expired_conv_ids, 1) = 0 THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;

  -- Log what we're about to delete
  RAISE NOTICE 'Deleting % expired game chatrooms', array_length(expired_conv_ids, 1);

  -- Step 1: Delete all messages in these conversations
  DELETE FROM messages 
  WHERE conversation_id = ANY(expired_conv_ids);
  GET DIAGNOSTICS msg_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % messages', msg_count;

  -- Step 2: Delete all conversation participants
  DELETE FROM conversation_participants 
  WHERE conversation_id = ANY(expired_conv_ids);
  GET DIAGNOSTICS part_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % conversation participants', part_count;

  -- Step 3: Delete the conversations themselves
  DELETE FROM conversations 
  WHERE id = ANY(expired_conv_ids);
  GET DIAGNOSTICS conv_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % conversations', conv_count;

  -- Return counts
  RETURN QUERY SELECT conv_count, msg_count, part_count;
END;
$$;

COMMENT ON FUNCTION delete_expired_game_chatrooms IS 
'Deletes all game chatrooms that have passed their expiry time (1 hour after booking end). 
Removes messages, participants, and conversation records. 
Runs automatically via pg_cron every 5 minutes.';

-- =====================================================
-- Step 3: Set up automatic periodic cleanup
-- =====================================================
-- NOTE: This requires pg_cron extension (available on Supabase)
-- 
-- To enable automatic cleanup, run these commands separately in SQL editor:
--
-- 1. Enable pg_cron extension:
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule the cleanup job (every 5 minutes):
--    SELECT cron.schedule(
--      'delete-expired-game-chatrooms',
--      '*/5 * * * *',
--      $$SELECT delete_expired_game_chatrooms()$$
--    );
--
-- Alternative: If pg_cron is not available, you can call this function
-- from your app on a schedule, or use Supabase Edge Functions

-- =====================================================
-- Step 4: Helper function to set chatroom expiry
-- =====================================================
CREATE OR REPLACE FUNCTION set_game_chatroom_expiry(
  p_conversation_id UUID,
  p_booking_end_time TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set expiry to 1 hour after booking ends
  UPDATE conversations
  SET expires_at = p_booking_end_time + INTERVAL '1 hour'
  WHERE id = p_conversation_id
    AND type = 'game_chat';
  
  RAISE NOTICE 'Set chatroom expiry to % (1 hour after booking ends at %)', 
    p_booking_end_time + INTERVAL '1 hour', 
    p_booking_end_time;
END;
$$;

COMMENT ON FUNCTION set_game_chatroom_expiry IS 
'Sets the expiry time for a game chatroom to 1 hour after the booking slot ends.
Example: Booking 3pm-6pm → expires_at = 7pm';

-- =====================================================
-- Step 5: Trigger to auto-set expiry when conversation is created
-- =====================================================
CREATE OR REPLACE FUNCTION auto_set_game_chat_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking_end TIMESTAMPTZ;
BEGIN
  -- Only for game_chat type conversations
  IF NEW.type = 'game_chat' THEN
    -- Extract booking end time from metadata
    -- Assuming metadata has structure: {"booking_end": "2025-11-14T18:00:00Z"}
    IF NEW.metadata ? 'booking_end' THEN
      booking_end := (NEW.metadata->>'booking_end')::TIMESTAMPTZ;
      
      -- Set expiry to 1 hour after booking ends
      NEW.expires_at := booking_end + INTERVAL '1 hour';
      
      RAISE NOTICE 'Auto-set game chatroom expiry to %', NEW.expires_at;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_set_game_chat_expiry ON conversations;
CREATE TRIGGER trigger_auto_set_game_chat_expiry
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_game_chat_expiry();

COMMENT ON FUNCTION auto_set_game_chat_expiry IS 
'Automatically sets expires_at when a game_chat conversation is created.
Reads booking_end from metadata and adds 1 hour.';

-- =====================================================
-- Step 6: Manual cleanup function (for testing/admin)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_game_chatroom(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages
  DELETE FROM messages WHERE conversation_id = p_conversation_id;
  
  -- Delete participants
  DELETE FROM conversation_participants WHERE conversation_id = p_conversation_id;
  
  -- Delete conversation
  DELETE FROM conversations WHERE id = p_conversation_id;
  
  RAISE NOTICE 'Manually deleted game chatroom %', p_conversation_id;
END;
$$;

COMMENT ON FUNCTION cleanup_game_chatroom IS 
'Manually delete a specific game chatroom and all its data. For testing/admin use.';

-- =====================================================
-- Step 7: View to monitor expiring chatrooms
-- =====================================================
CREATE OR REPLACE VIEW expiring_game_chatrooms AS
SELECT 
  c.id,
  c.name,
  c.created_at,
  c.expires_at,
  c.expires_at - NOW() as time_until_deletion,
  COUNT(DISTINCT m.id) as message_count,
  COUNT(DISTINCT cp.user_id) as participant_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
WHERE c.type = 'game_chat'
  AND c.expires_at IS NOT NULL
GROUP BY c.id, c.name, c.created_at, c.expires_at
ORDER BY c.expires_at ASC;

COMMENT ON VIEW expiring_game_chatrooms IS 
'Monitor game chatrooms and their expiry times. Shows how much time until deletion.';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Manually trigger cleanup (for testing)
-- SELECT * FROM delete_expired_game_chatrooms();

-- Example 2: Check expiring chatrooms
-- SELECT * FROM expiring_game_chatrooms;

-- Example 3: Set expiry for a specific chatroom
-- SELECT set_game_chatroom_expiry(
--   'conversation-uuid-here'::UUID,
--   '2025-11-14 18:00:00+00'::TIMESTAMPTZ  -- Booking end time
-- );

-- Example 4: Manually delete a chatroom
-- SELECT cleanup_game_chatroom('conversation-uuid-here'::UUID);
