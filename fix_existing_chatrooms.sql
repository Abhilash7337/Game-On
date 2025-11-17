-- =====================================================
-- FIX EXISTING GAME CHATROOMS - SET EXPIRY RETROACTIVELY
-- =====================================================
-- This updates old game chatrooms to have expires_at based on their booking end time
-- Run this ONCE to fix existing chatrooms created before the migration
-- =====================================================

-- Step 1: Check how many game chats exist without expires_at
SELECT 
  COUNT(*) as chatrooms_without_expiry,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as chatrooms_with_expiry
FROM conversations
WHERE type = 'game_chat';

-- Step 2: Update existing game chatrooms to set expires_at based on booking data
UPDATE conversations c
SET expires_at = (
  -- Calculate: booking_date + end_time + 1 hour
  SELECT (b.booking_date + b.end_time + INTERVAL '1 hour')
  FROM bookings b
  WHERE b.id = c.booking_id
)
WHERE c.type = 'game_chat'
  AND c.booking_id IS NOT NULL
  AND c.expires_at IS NULL;  -- Only update ones without expiry

-- Step 3: Check how many were updated
SELECT 
  COUNT(*) as total_game_chats,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as with_expiry,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as already_expired
FROM conversations
WHERE type = 'game_chat';

-- Step 4: Delete any that are already expired (past games)
SELECT * FROM delete_expired_game_chatrooms();

-- Step 5: Verify - show remaining game chats with their expiry times
SELECT 
  c.id,
  c.name,
  c.expires_at,
  CASE 
    WHEN c.expires_at < NOW() THEN 'Should be deleted'
    ELSE 'Still active'
  END as status,
  c.expires_at - NOW() as time_remaining
FROM conversations c
WHERE c.type = 'game_chat'
ORDER BY c.expires_at ASC;
