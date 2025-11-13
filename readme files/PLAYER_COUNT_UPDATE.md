# Player Count Update (1-5 Players Support)

## Summary
Updated the booking system to support 1-5 players for Open Games with proper color coding and real-time updates.

## Changes Made

### 1. **BookingFormScreen.tsx**
- ✅ Changed players required from `['2', '4', '6', '8']` to `['1', '2', '3', '4', '5']`
- Now supports 1-5 player Open Games

### 2. **VenueDetailsScreen.tsx**
- ✅ Enhanced color logic for time slots based on spots remaining:
  - **Grey (Booked)**: 
    - Private games
    - User's own Open Games (host view)
    - Open games with 0 spots left
  - **Red (Last Spot)**: Open games with exactly 1 spot remaining
  - **Orange (Joining)**: Open games with 2+ spots remaining
  - **Green (Available)**: No bookings

### 3. **JoinGameScreen.tsx**
- ✅ Enhanced join logic with better logging
- ✅ Shows updated player counts after joining
- ✅ Reloads booking details after successful join
- ✅ Displays your share amount in confirmation dialog

### 4. **bookingStorage.ts**
- ✅ Fixed `joinOpenGame()` logic:
  - Simplified player count tracking
  - `player_count` in DB = spots still needed (not total)
  - Decrements by 1 when user joins
  - Better validation and error messages
  
- ✅ Enhanced `getBookingWithParticipants()`:
  - Added detailed logging of player counts
  - Shows: host (1) + participants + spots needed

## How It Works

### Database Schema
- `bookings.player_count` = **spots still needed** (not total players)
- `booking_participants` table tracks who joined
- Host is always the `bookings.user_id` (not in participants table)

### Player Count Calculation
```
Total Slots = currentPlayers + spotsNeeded
currentPlayers = 1 (host) + participants.length
spotsNeeded = bookings.player_count
```

### Example Flow
1. **Host creates Open Game needing 3 players**
   - DB: `player_count = 3`
   - Display: "3 spots available" (orange)

2. **User A joins**
   - DB: `player_count = 2` (decremented)
   - `booking_participants` gets new row
   - Display: "2 spots available" (orange)

3. **User B joins**
   - DB: `player_count = 1` (decremented)
   - Display: "1 spot available" (red - last spot!)

4. **User C joins**
   - DB: `player_count = 0` (game full)
   - Display: Grey box "Booked" (game full)

### Color Logic (VenueDetailsScreen)
```typescript
if (playersNeeded === 0) → Grey (Full)
else if (playersNeeded === 1) → Red (Last spot!)
else if (playersNeeded === 2) → Orange (Filling up)
else if (playersNeeded >= 3) → Orange (Plenty of space)
```

### Host Detection
- If `bookingUserId === currentUserId` → User is host
- Hosts see their games as grey "Booked" (can't join own game)
- Other users see orange/red "Join Game" based on spots

## Testing Checklist

- [ ] Create Open Game with 1 player needed
- [ ] Create Open Game with 2 players needed
- [ ] Create Open Game with 3 players needed
- [ ] Create Open Game with 4 players needed
- [ ] Create Open Game with 5 players needed
- [ ] Join a game and verify color changes (orange → red → grey)
- [ ] Check host sees grey "Booked" for their own game
- [ ] Check other devices see orange/red "Join Game"
- [ ] Verify player count updates in JoinGameScreen
- [ ] Verify "Your Share" calculates correctly
- [ ] Test game becoming full (0 spots left)

## RLS Policy (Already Fixed)
✅ "Enable read access for all authenticated users" policy allows cross-device visibility

## Logs to Watch
```
📊 [STORAGE] Current spots needed: X
✅ [STORAGE] User joined game! Spots remaining: Y
📊 [STORAGE] Booking player counts: {host: 1, participants: X, currentPlayers: Y, spotsNeeded: Z}
🔴 Open Game → LAST SPOT (red, 1 spot left)
🟠 Open Game → JOINING (orange, X spots left)
⚪ Your Open Game (HOST) → BOOKED (grey, your game)
```
