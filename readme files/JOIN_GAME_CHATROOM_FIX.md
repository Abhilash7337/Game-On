# Fix: Join Game with Auto-Chatroom Addition

## Issues Fixed

### 1. Database Constraint Error
**Problem**: When joining a game, got error:
```
"new row for relation \"booking_participants\" violates check constraint \"booking_participants_status_check\""
```

**Root Cause**: Used `status: 'joined'` but database constraint expects standard statuses like `'pending'`, `'confirmed'`, `'cancelled'`

**Solution**: Changed status from `'joined'` to `'confirmed'` in:
- `bookingStorage.ts` - `joinOpenGame()` function
- `bookingStorage.ts` - `getBookingWithParticipants()` function
- `VenueDetailsScreen.tsx` - participant count query

### 2. Missing Auto-Chatroom Feature
**Problem**: Users joining a game were not automatically added to the game's chatroom

**Solution**: Added chatroom management to `joinOpenGame()`:
1. Check if chatroom exists for the booking
2. If not, create a new chatroom linked to the booking
3. Add the joining user to the chatroom
4. Handle errors gracefully (don't fail join if chat fails)

## Changes Made

### bookingStorage.ts

#### Fix 1: Change status from 'joined' to 'confirmed'
```typescript
// INSERT into booking_participants
status: 'confirmed'  // ✅ Was: 'joined'

// SELECT from booking_participants
.eq('status', 'confirmed')  // ✅ Was: 'joined'
```

#### Fix 2: Add user to chatroom after joining
```typescript
// After successfully adding participant:
1. Query chatrooms table for existing room with booking_id
2. If no room exists, create new chatroom:
   - booking_id: bookingId
   - name: "Game Chat"
   - type: "booking"
3. Add user to chatroom_members:
   - chatroom_id: chatroomId
   - user_id: userId
   - joined_at: timestamp
```

### VenueDetailsScreen.tsx
- Changed participant query from `status: 'joined'` to `status: 'confirmed'`

## Database Schema Assumptions

### booking_participants table
```sql
- id (UUID)
- booking_id (UUID) → bookings.id
- user_id (UUID) → users.id
- status (TEXT) CHECK IN ('pending', 'confirmed', 'cancelled')
- joined_at (TIMESTAMPTZ)
```

### chatrooms table
```sql
- id (UUID)
- booking_id (UUID) → bookings.id (optional)
- name (TEXT)
- type (TEXT) e.g., 'booking', 'group', 'direct'
- created_at (TIMESTAMPTZ)
```

### chatroom_members table
```sql
- id (UUID)
- chatroom_id (UUID) → chatrooms.id
- user_id (UUID) → users.id
- joined_at (TIMESTAMPTZ)
```

## Flow After Fix

1. **User clicks "Join Game"**
   - Opens JoinGameScreen
   - Shows booking details, host, participants, cost split

2. **User confirms join**
   - Calls `BookingStorageService.joinOpenGame(bookingId, userId)`
   
3. **joinOpenGame() executes:**
   ```
   ✓ Check user not already participant
   ✓ Get booking details from DB
   ✓ Verify it's an open game
   ✓ Check spots available (player_count > 0)
   ✓ Insert into booking_participants with status='confirmed'
   ✓ Decrement bookings.player_count by 1
   ✓ Get/Create chatroom for booking
   ✓ Add user to chatroom_members
   ✓ Return success
   ```

4. **UI Updates:**
   - VenueDetailsScreen refreshes
   - Color changes: Orange (2 spots) → Orange/Red (1 spot) → Grey (0 spots)
   - User can now access game chatroom
   - Payment split updates

## Testing Checklist

- [x] Fix database constraint error
- [x] User successfully joins game
- [x] player_count decrements correctly
- [x] Chatroom created for booking
- [x] User added to chatroom
- [x] Status queries use 'confirmed' everywhere
- [ ] Test chatroom access after joining
- [ ] Test multiple users joining same game
- [ ] Test chatroom shows all participants
- [ ] Test game full (0 spots) prevents more joins

## Logs to Watch

**Success Flow:**
```
🎮 [STORAGE] User [userId] joining booking [bookingId]...
📊 [STORAGE] Current spots needed: 2
✅ [STORAGE] User joined game! Spots remaining: 1
💬 [STORAGE] Adding user to game chatroom...
📝 [STORAGE] Creating new chatroom for booking [bookingId]...
✅ [STORAGE] Created chatroom: [chatroomId]
✅ [STORAGE] User added to chatroom: [chatroomId]
✅ [JOIN GAME] Successfully joined!
```

**Error Cases:**
```
❌ [STORAGE] No spots available (game is full)
⚠️ [STORAGE] User is already a participant
⚠️ [STORAGE] Failed to create chatroom: [error]
⚠️ [STORAGE] Failed to add user to chatroom: [error]
```

## Notes

- Chatroom errors are non-blocking (won't fail the join)
- Host is NOT in booking_participants (only in bookings.user_id)
- Host should be added to chatroom when creating the booking
- Status values standardized: 'pending', 'confirmed', 'cancelled'
