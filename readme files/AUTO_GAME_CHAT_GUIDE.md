# Auto Game Chat Implementation Guide

## Overview
This system automatically creates and manages game chat rooms when bookings are confirmed and users join open games.

## How It Works

### 1. When Booking is Confirmed
```
Venue Owner Accepts Booking
         ↓
bookings.status = 'confirmed'
         ↓
TRIGGER: create_game_chat_on_booking_confirmation()
         ↓
Creates conversation with metadata:
  - Venue name
  - Court name
  - Date & Time
  - Duration
  - Sport
  - Booking type (open/private)
         ↓
Automatically adds host to conversation_participants
```

### 2. When User Joins Open Game
```
User Clicks "Join Game"
         ↓
INSERT INTO booking_participants (status='confirmed')
         ↓
TRIGGER: add_user_to_game_chat_on_join()
         ↓
Finds game chat conversation for this booking
         ↓
Adds user to conversation_participants
         ↓
User can now see previous messages & chat
```

### 3. When User Cancels/Leaves
```
User Cancels Participation
         ↓
booking_participants.status = 'cancelled'
         ↓
TRIGGER: remove_user_from_game_chat_on_leave()
         ↓
Sets is_active = false in conversation_participants
         ↓
User removed from chat (but messages preserved)
```

## Database Schema Used

### Conversations Table
```sql
type: 'game_chat'
name: "Venue - Court (DD Mon)"
booking_id: UUID (links to bookings)
metadata: {
  booking_id: UUID,
  venue: "Arena Sports",
  court: "Court 1",
  date: "2025-11-07",
  time: "10:00:00",
  duration: 1.5, // hours
  sport: "Badminton",
  booking_type: "open",
  is_open_game: true
}
```

### Conversation Participants
```sql
conversation_id: UUID
user_id: UUID
joined_at: TIMESTAMP
is_active: BOOLEAN
```

## Triggers Created

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `auto_create_game_chat` | bookings | INSERT/UPDATE status | Creates game chat when confirmed |
| `auto_add_to_game_chat` | booking_participants | INSERT/UPDATE status | Adds user to chat when joining |
| `auto_remove_from_game_chat` | booking_participants | UPDATE status | Removes user when cancelling |

## Features

### ✅ Automatic Game Chat Creation
- Creates chat immediately when booking confirmed
- Includes all booking details in metadata
- Host automatically added as first participant
- Chat name: "Venue - Court (Date)"

### ✅ Automatic User Addition
- Users auto-added when joining open games
- Can see all previous messages (full history)
- Real-time updates when new users join

### ✅ Automatic User Removal
- Marks users inactive when they cancel
- Preserves message history
- Clean chat participant list

### ✅ Backfill Support
- Automatically creates chats for existing confirmed bookings
- Adds existing participants to their game chats
- No manual work needed

## Testing the System

### Test 1: New Booking Flow
```sql
-- 1. Create a new booking
INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, booking_type, status)
VALUES (
  'your-user-id',
  'court-id',
  CURRENT_DATE + 1,
  '10:00',
  '11:00',
  'open',
  'pending'
);

-- 2. Confirm the booking (simulates venue owner accepting)
UPDATE bookings SET status = 'confirmed' WHERE id = 'booking-id';

-- 3. Check if game chat was created
SELECT * FROM conversations WHERE booking_id = 'booking-id' AND type = 'game_chat';

-- 4. Check if host was added
SELECT * FROM conversation_participants WHERE conversation_id = 'conversation-id';
```

### Test 2: Join Open Game
```sql
-- 1. Another user joins the game
INSERT INTO booking_participants (booking_id, user_id, status)
VALUES ('booking-id', 'another-user-id', 'confirmed');

-- 2. Check if user was added to chat
SELECT * FROM conversation_participants WHERE conversation_id = 'conversation-id';

-- 3. User should now see the chat in app
```

### Test 3: Cancel Participation
```sql
-- 1. User cancels
UPDATE booking_participants 
SET status = 'cancelled' 
WHERE booking_id = 'booking-id' AND user_id = 'user-id';

-- 2. Check if user marked inactive
SELECT is_active FROM conversation_participants 
WHERE conversation_id = 'conversation-id' AND user_id = 'user-id';
-- Should return: false
```

## UI Flow (Already Implemented)

### In Social Tab - Game Chats
```
User sees list of game chats:
├─ Arena Sports - Court 1 (07 Nov)
│  └─ Host badge (if user is host)
│  └─ 10:00 • 1.5h • 4 participants
├─ City Stadium - Court 2 (08 Nov)
└─ ...

Tap on chat → Opens GameChatScreen
└─ Real-time messaging
└─ Shows venue, court, date, time
└─ All participants can chat
└─ New joiners see previous messages
```

## Integration with Existing Code

### GameChatroomService.ts
Already uses this system! The `getUserChatrooms()` method:
```typescript
// Fetches game chats from conversations table
// Filters by user's participation
// Includes all metadata (venue, court, date, time)
// Shows host status
```

### social.tsx
Already displays game chats correctly:
```typescript
// Loads via GameChatroomService.getUserChatrooms()
// Shows in "Game Chats" tab
// Displays host badge
// Navigation to GameChatScreen
```

### GameChatScreen.tsx
Already handles messaging:
```typescript
// Real-time Supabase subscriptions
// Message history loaded automatically
// New participants see all messages
```

## Message History for New Joiners

**Already Working!** ✅

When a user joins:
1. They're added to `conversation_participants`
2. UI loads messages with: `SELECT * FROM messages WHERE conversation_id = X`
3. All previous messages are visible
4. No special code needed - it's automatic!

## What Happens When...

### Scenario 1: User books → Venue confirms
```
1. User creates booking (status='pending')
2. Venue owner accepts (status='confirmed')
3. ✅ Game chat auto-created
4. ✅ User (host) auto-added to chat
5. User sees chat in "Game Chats" tab
```

### Scenario 2: User joins open game
```
1. User clicks "Join" on open game
2. Creates booking_participant (status='confirmed')
3. ✅ User auto-added to game chat
4. ✅ User sees all previous messages
5. User can chat with others
```

### Scenario 3: Multiple users join
```
1. User A creates booking → confirmed
2. ✅ Chat created, User A added
3. User B joins → confirmed
4. ✅ User B added to chat, sees A's messages
5. User C joins → confirmed
6. ✅ User C added to chat, sees A & B's messages
7. All users chat together
```

### Scenario 4: User cancels
```
1. User clicks "Cancel"
2. booking_participant.status = 'cancelled'
3. ✅ User marked inactive in chat
4. User removed from chat participant list
5. Messages preserved in history
```

## Migration File

**File:** `004_auto_game_chats.sql`

**Run this now to enable the system!**

**What it does:**
- Creates 3 trigger functions
- Creates 3 triggers
- Backfills existing bookings (creates chats for them)
- Adds existing participants to their chats
- Verifies everything worked

**Safe to run:** Yes! Includes checks and won't duplicate data.

## Verification After Running

You should see:
```
✅ AUTO GAME CHAT SYSTEM ACTIVE!
Existing game chats: X
Confirmed bookings: Y

📋 Features Enabled:
✅ Auto-create game chat when booking confirmed
✅ Auto-add users when they join open games
✅ Auto-remove users when they cancel
✅ Host automatically added to game chat
✅ Previous messages visible to new joiners
```

## FAQ

**Q: What if booking is cancelled after chat created?**
A: Chat remains (for history), but marked inactive. You can add a cleanup function if needed.

**Q: Can private bookings have game chats?**
A: Yes! The system works for both open and private. Metadata has `is_open_game` flag.

**Q: What if user tries to join but booking is full?**
A: The booking_participants insert will handle capacity. Chat only adds confirmed participants.

**Q: Do messages get deleted when user leaves?**
A: No! Messages are preserved. Only the participant is marked inactive.

**Q: Can I manually create game chats?**
A: Yes, but not needed. The trigger handles everything automatically.

## Summary

**What's Automatic Now:**
1. ✅ Game chat creation on booking confirmation
2. ✅ Host added to chat
3. ✅ Users added when joining open games
4. ✅ Users removed when cancelling
5. ✅ Message history visible to all
6. ✅ Real-time updates
7. ✅ Backfilled existing bookings

**What You Need to Do:**
- Run `004_auto_game_chats.sql`
- Test by creating a booking and confirming it
- Test by joining an open game
- Verify chat appears in app

**No Code Changes Needed!** Everything uses existing UI and services. 🎉
