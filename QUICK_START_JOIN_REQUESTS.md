# 🚀 Quick Start Guide - Join Request System

## Prerequisites
- Supabase project set up
- App running with authentication
- Users table exists
- Bookings table exists
- Conversations table exists
- Notifications table exists

## 🎯 5-Minute Setup

### Step 1: Run SQL Script (2 minutes)
1. Open Supabase Dashboard → SQL Editor
2. Copy entire content from: `supabase sql files/create_join_requests_table.sql`
3. Click "Run"
4. Verify success: `SELECT * FROM public.join_requests LIMIT 1;`

### Step 2: Verify Installation (1 minute)
```sql
-- Check table exists
SELECT tablename FROM pg_tables WHERE tablename = 'join_requests';

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'join_requests';

-- Check triggers (should see 3)
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.join_requests'::regclass;

-- Check real-time enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'join_requests';
```

### Step 3: Test Flow (2 minutes)
1. **As User A (Host):**
   - Create a new game booking
   - Note the booking ID

2. **As User B (Requester):**
   - Navigate to JoinGameScreen for that booking
   - Click "Send Join Request"
   - See button change to "Request Pending"
   - Click chat icon to message host

3. **As User A (Host):**
   - Open notifications (should see new request)
   - OR open chat with User B
   - Click three-dots menu → Join Requests
   - See the request with game details
   - Click Accept

4. **As User B (Requester):**
   - Check notifications → Should see "Request Accepted"
   - Button should show "Already Joined"

## ✅ Verification Checklist

Run these checks after setup:

```sql
-- 1. Check join_requests table structure
\d public.join_requests

-- 2. Check policies (should see 4)
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'join_requests';

-- 3. Check indexes (should see 5)
SELECT indexname FROM pg_indexes 
WHERE tablename = 'join_requests';

-- 4. Test insert (should work if authenticated)
INSERT INTO public.join_requests (booking_id, requester_id, host_id, status)
VALUES (
  'your-booking-id',
  auth.uid(),
  'host-user-id',
  'pending'
);

-- 5. Check trigger functions exist
SELECT proname FROM pg_proc 
WHERE proname IN (
  'update_join_requests_updated_at',
  'handle_join_request_accepted',
  'auto_reject_requests_when_full'
);
```

## 🐛 Common Issues

### Issue: "relation public.join_requests does not exist"
**Fix:** Run the SQL script in Supabase SQL Editor

### Issue: "permission denied for table join_requests"
**Fix:** 
```sql
-- Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'join_requests';
```

### Issue: Three-dots menu not showing pending count
**Fix:** Check if user is the host of any games with pending requests
```sql
SELECT jr.*, b.venue_name 
FROM join_requests jr
JOIN bookings b ON jr.booking_id = b.id
WHERE jr.host_id = auth.uid() 
  AND jr.status = 'pending';
```

### Issue: Accept/Reject not working
**Fix:** Verify triggers are created
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'public.join_requests'::regclass;
```

### Issue: Notifications not appearing
**Fix:** Check if notifications table and trigger work
```sql
-- Manually test notification creation
INSERT INTO public.notifications (user_id, type, title, message)
VALUES (auth.uid(), 'test', 'Test', 'Testing notifications');

-- Check if it appears
SELECT * FROM notifications WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 5;
```

## 📝 Quick Reference

### Service Methods
```typescript
// Send request
await JoinRequestService.sendJoinRequest(bookingId, hostId);

// Accept request (host only)
await JoinRequestService.acceptJoinRequest(requestId);

// Reject request (host only)
await JoinRequestService.rejectJoinRequest(requestId);

// Cancel request (requester only)
await JoinRequestService.cancelJoinRequest(requestId);

// Get requests for a booking
await JoinRequestService.getJoinRequestsForBooking(bookingId);

// Get my pending requests
await JoinRequestService.getMyPendingRequests();

// Check status for specific game
await JoinRequestService.getMyRequestStatus(bookingId);

// Get count of pending requests I've received as host
await JoinRequestService.getPendingRequestsCount();

// Subscribe to real-time updates
const unsubscribe = await JoinRequestService.subscribeToJoinRequests((requests) => {
  console.log('Requests updated:', requests);
});
```

### Navigation Paths
```typescript
// Send join request screen
router.push(`/JoinGameScreen?bookingId=${bookingId}`);

// Chat with host/requester
router.push(`/FriendChatScreen?friendId=${userId}&conversationId=${convId}`);

// User profile
router.push(`/UserProfileScreen?userId=${userId}`);

// Notifications
router.push('/NotificationsScreen');

// Game chats
router.push('/(tabs)/social'); // Then switch to Game Chats tab
```

## 🎯 Feature Status

| Feature | Status | Location |
|---------|--------|----------|
| Database Schema | ✅ Complete | `create_join_requests_table.sql` |
| Service Layer | ✅ Complete | `src/common/services/joinRequestService.ts` |
| Send Request UI | ✅ Complete | `app/JoinGameScreen.tsx` |
| Chat Dropdown | ✅ Complete | `app/FriendChatScreen.tsx` |
| Join Requests Modal | ✅ Complete | `app/FriendChatScreen.tsx` |
| Notifications UI | ✅ Complete | `app/NotificationsScreen.tsx` |
| User Profile | ✅ Complete | `app/UserProfileScreen.tsx` |
| Game Chats | ✅ Complete | `app/(tabs)/social.tsx` |
| Real-time Updates | ✅ Complete | Database triggers + subscriptions |
| Auto-Reject | ✅ Complete | Database trigger |

## 🎉 You're Ready!

The join request system is fully implemented and ready to use! Users can now:
- Request to join games
- Chat with hosts
- Accept/reject from chat or notifications
- View profiles
- Get real-time updates

Need help? Check `JOIN_REQUEST_SYSTEM_COMPLETE.md` for detailed documentation.
