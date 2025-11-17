# 🗑️ AUTO-DELETE GAME CHATROOMS SETUP GUIDE

## 📋 Overview

This system automatically deletes game chatrooms **1 hour after the booking slot ends**. Everything is removed from the database: messages, participants, and the conversation itself.

**Example:**
- Booking: 3pm - 6pm on Nov 14, 2025
- Chatroom created: When booking confirmed
- **Chatroom deleted: 7pm (6pm + 1 hour)** ✅

---

## 🏗️ Architecture

### 1. **Database Layer (Primary)**
   - **expires_at column** added to `conversations` table
   - **Automatic trigger** sets expiry when chatroom is created
   - **Scheduled job** (pg_cron) runs every 5 minutes to delete expired chatrooms
   - **Database function** handles the deletion (messages → participants → conversation)

### 2. **Client Layer (Backup)**
   - Client-side cleanup service runs when user opens Social tab
   - Provides immediate cleanup if database job hasn't run yet
   - Also checks for expiring chatrooms to show warnings

---

## 📁 Files Created/Modified

### New Files:
1. ✅ `supabase/migrations/add_conversation_expiry.sql` - Database schema and functions
2. ✅ `supabase/migrations/update_booking_trigger_expiry.sql` - Updated trigger
3. ✅ `src/common/services/gameChatroomCleanup.ts` - Client-side cleanup service

### Modified Files:
4. ✅ `app/(tabs)/social.tsx` - Added auto-cleanup on load
5. ✅ `Supabase_tables_created.md` - Documentation updated

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Run Database Migrations

You need to execute the SQL migrations in your Supabase dashboard:

#### A. Add expires_at column and functions
```sql
-- Copy the entire content of:
-- supabase/migrations/add_conversation_expiry.sql
-- And run it in Supabase SQL Editor
```

This will:
- Add `expires_at` column to `conversations` table
- Create `delete_expired_game_chatrooms()` function
- Create helper functions for manual cleanup
- Create monitoring view

#### B. Update booking trigger
```sql
-- Copy the entire content of:
-- supabase/migrations/update_booking_trigger_expiry.sql
-- And run it in Supabase SQL Editor
```

This will:
- Update the `create_game_chat_on_booking_confirmation()` function
- Now sets `expires_at = booking_end + 1 hour` automatically

### Step 2: Enable pg_cron (Automatic Cleanup)

**Option A: If pg_cron is available on your Supabase plan**
```sql
-- 1. Enable the extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the cleanup job (run once)
SELECT cron.schedule(
  'delete-expired-game-chatrooms',
  '*/5 * * * *',  -- Every 5 minutes
  $$SELECT delete_expired_game_chatrooms()$$
);

-- 3. Verify the job is scheduled
SELECT * FROM cron.job;
```

**Option B: If pg_cron is NOT available (use Supabase Edge Function)**

Create a Supabase Edge Function to run the cleanup:

```typescript
// supabase/functions/cleanup-expired-chatrooms/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase.rpc('delete_expired_game_chatrooms');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    deleted: data[0]
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Then schedule it with a cron service (e.g., GitHub Actions, Vercel Cron, or Supabase Cron Triggers).

**Option C: Manual Testing (for now)**

You can manually trigger cleanup by calling the function:
```sql
SELECT * FROM delete_expired_game_chatrooms();
```

---

## ✅ VERIFICATION

### 1. Check Database Schema
```sql
-- Verify expires_at column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations' 
  AND column_name = 'expires_at';

-- Should return: expires_at | timestamp with time zone
```

### 2. Test Trigger (Create Test Booking)
```sql
-- Update an existing booking to confirmed status
-- This should trigger chatroom creation with expiry
UPDATE bookings 
SET status = 'confirmed'
WHERE id = 'your-booking-id';

-- Check if chatroom was created with expiry
SELECT 
  id,
  name,
  expires_at,
  expires_at - NOW() as time_until_deletion
FROM conversations
WHERE type = 'game_chat'
  AND booking_id = 'your-booking-id';

-- expires_at should be booking_end + 1 hour
```

### 3. Test Cleanup Function
```sql
-- Create a test chatroom with past expiry
INSERT INTO conversations (type, name, expires_at, metadata, created_at, updated_at)
VALUES (
  'game_chat',
  'Test Chatroom',
  NOW() - INTERVAL '1 hour', -- Already expired
  '{"test": true}'::jsonb,
  NOW(),
  NOW()
);

-- Run cleanup (should delete the test chatroom)
SELECT * FROM delete_expired_game_chatrooms();

-- Should return: deleted_conversations: 1, deleted_messages: 0, deleted_participants: 0
```

### 4. Monitor Expiring Chatrooms
```sql
-- View all chatrooms and their expiry times
SELECT * FROM expiring_game_chatrooms;

-- Should show:
-- - Chatroom name
-- - Expiry timestamp
-- - Time until deletion (interval)
-- - Message count
-- - Participant count
```

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Create Booking → Verify Auto-Expiry
1. Create a booking for today, 2pm-3pm
2. Confirm the booking
3. Check database:
   ```sql
   SELECT name, expires_at 
   FROM conversations 
   WHERE booking_id = 'your-booking-id';
   ```
4. **Expected:** expires_at = today 4pm (3pm + 1 hour)

### Scenario 2: Wait for Expiry → Verify Auto-Deletion
1. Create booking that ends in 5 minutes
2. Wait 1 hour and 6 minutes (1 hour after end + 5 min for cron)
3. Check database:
   ```sql
   SELECT * FROM conversations WHERE booking_id = 'your-booking-id';
   ```
4. **Expected:** No rows (chatroom deleted)

### Scenario 3: Client-Side Cleanup
1. Create expired chatroom (manually set expires_at in past)
2. Open app → Go to Social tab → Game Chats
3. Check console logs
4. **Expected:** 
   - Log: "Running cleanup before loading chatrooms..."
   - Log: "Deleted 1 expired chatrooms"
   - Chatroom not visible in list

---

## 📊 MONITORING

### Check Cleanup Job Status (if using pg_cron)
```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'delete-expired-game-chatrooms')
ORDER BY start_time DESC 
LIMIT 10;
```

### View Cleanup Stats
```sql
-- See what will be deleted in next run
SELECT COUNT(*) as expired_chatrooms
FROM conversations
WHERE type = 'game_chat'
  AND expires_at < NOW();
```

### Manual Cleanup (Admin)
```sql
-- Delete specific chatroom manually
SELECT cleanup_game_chatroom('conversation-uuid-here'::UUID);

-- Delete all expired chatrooms now
SELECT * FROM delete_expired_game_chatrooms();
```

---

## ⚠️ IMPORTANT NOTES

### 1. **Data is PERMANENTLY deleted**
   - Messages are not recoverable after deletion
   - Make sure users are aware chats are temporary
   - Consider adding UI warnings: "This chat will be deleted 1 hour after the game ends"

### 2. **Timing Precision**
   - Deletion happens within 5 minutes of expiry (pg_cron interval)
   - Exact time: `booking_end + 1 hour + up to 5 minutes`
   - Example: 6pm end → deleted between 7:00pm and 7:05pm

### 3. **Timezone Handling**
   - All timestamps use `TIMESTAMPTZ` (timezone-aware)
   - Expiry calculation uses booking's timezone
   - Database function uses `NOW()` (server time in UTC)

### 4. **Edge Cases Handled**
   - Booking cancelled → chatroom not created (no expiry needed)
   - Booking rescheduled → new chatroom created with new expiry
   - User leaves chatroom → still gets deleted at expiry (affects all participants)

---

## 🐛 TROUBLESHOOTING

### Issue: Chatrooms not being deleted
**Possible causes:**
1. pg_cron not enabled
2. Cron job not scheduled
3. expires_at column missing
4. Database function has errors

**Solutions:**
```sql
-- 1. Check if pg_cron is available
SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';

-- 2. Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'delete_expired_game_chatrooms';

-- 3. Manually run cleanup and check for errors
SELECT * FROM delete_expired_game_chatrooms();

-- 4. Check logs
SELECT * FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Issue: expires_at not being set on new chatrooms
**Possible causes:**
1. Trigger not updated
2. Booking metadata missing end time
3. Trigger function has errors

**Solutions:**
```sql
-- 1. Check if trigger is active
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'auto_create_game_chat';

-- 2. Check trigger function
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_game_chat_on_booking_confirmation';

-- 3. Test trigger manually
UPDATE bookings 
SET status = 'confirmed' 
WHERE id = 'test-booking-id';

-- Check if expires_at was set
SELECT expires_at FROM conversations WHERE booking_id = 'test-booking-id';
```

---

## 📱 USER EXPERIENCE

### UI Recommendations (Optional Enhancements)

1. **Show expiry warning in chat:**
   ```typescript
   // In GameChatScreen.tsx header
   if (expiryTime < 1 hour from now) {
     <Text>⏰ This chat will be deleted in {minutes} minutes</Text>
   }
   ```

2. **Filter expired chats client-side:**
   ```typescript
   const activeChats = gameChats.filter(chat => 
     !chat.expiresAt || new Date() < chat.expiresAt
   );
   ```

3. **Show notification before deletion:**
   ```typescript
   // 10 minutes before deletion
   sendNotification("Your game chat will be deleted in 10 minutes");
   ```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Run `add_conversation_expiry.sql` migration
- [ ] Run `update_booking_trigger_expiry.sql` migration
- [ ] Enable pg_cron extension (or set up Edge Function)
- [ ] Schedule cleanup job
- [ ] Test with a sample booking
- [ ] Verify cleanup runs (check cron.job_run_details)
- [ ] Client-side cleanup integrated
- [ ] Monitor for 24 hours to ensure it's working
- [ ] Add UI warnings (optional)

---

## 🎉 SUCCESS CRITERIA

✅ New chatrooms have `expires_at` set correctly  
✅ Expired chatrooms are deleted within 5 minutes  
✅ All messages, participants, and conversation deleted  
✅ Client-side cleanup works as backup  
✅ No orphaned data in database  
✅ Users don't see expired chats in UI  

---

## 📞 SUPPORT

If you encounter any issues:
1. Check the troubleshooting section above
2. Run manual cleanup: `SELECT * FROM delete_expired_game_chatrooms();`
3. Check database logs for errors
4. Verify all migrations ran successfully

**Questions? Ask me for help!** 🚀
