# Rating System Implementation

## Overview
Implemented a comprehensive player and venue rating system integrated into game chatrooms.

## Features Implemented

### 1. **RatePlayersScreen** (`app/RatePlayersScreen.tsx`)
Complete rating interface with:
- ✅ Rate venue (1-5 stars + written review)
- ✅ Rate all players in the game (1-5 stars each)
- ✅ Show current ratings for users and venues
- ✅ Prevent self-rating
- ✅ Update existing ratings
- ✅ Automatic average rating calculation
- ✅ Beautiful UI with avatars, host badges, star ratings

### 2. **Database Schema** (`supabase_create_user_ratings.sql`)
New `user_ratings` table:
```sql
- id (UUID, primary key)
- rater_user_id (UUID, references users)
- rated_user_id (UUID, references users)
- rating (INTEGER, 1-5)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE constraint: one rating per user pair
- CHECK constraint: prevent self-rating
```

**RLS Policies:**
- Users can insert/update their own ratings
- All authenticated users can view ratings
- Proper foreign key constraints

### 3. **GameChatScreen Integration** (`app/GameChatScreen.tsx`)
- ✅ Added stats icon button in header (next to game info)
- ✅ Button navigates to RatePlayersScreen
- ✅ Passes conversationId and bookingId as params

### 4. **Styles** (`styles/screens/GameChatScreen.ts`)
- ✅ Added `ratingButton` style (40x40, white icon on dark header)

## How It Works

### Rating Flow:
1. **User plays a game** → Game chat is created
2. **During/after game** → User clicks stats icon in chat header
3. **RatePlayersScreen opens** → Shows:
   - Venue card with current rating and review field
   - All participant cards (except current user)
   - Host badge for game creator
   - 5-star rating interface for each
4. **User rates** → Taps stars to rate (1-5)
5. **Submit ratings** → Updates database + recalculates averages
6. **Ratings reflect everywhere** → User profiles, venue cards, etc.

### Rating Calculation:
```typescript
// User Rating
AVG(all ratings for user) → updates users.rating

// Venue Rating  
AVG(all reviews for venue) → updates venues.rating
```

### Preventing Duplicates:
- UNIQUE constraint on (rater_user_id, rated_user_id)
- If rating exists → UPDATE
- If rating doesn't exist → INSERT

### Display Logic:
- Shows existing ratings when reopening screen
- Can't rate yourself (excluded from list)
- Host identified with badge
- Current ratings shown under each name

## Database Setup Required

Run this SQL in Supabase SQL Editor:

```sql
-- Create user_ratings table
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rater_user_id, rated_user_id),
  CHECK (rater_user_id != rated_user_id)
);

-- Create indexes
CREATE INDEX idx_user_ratings_rater ON public.user_ratings(rater_user_id);
CREATE INDEX idx_user_ratings_rated ON public.user_ratings(rated_user_id);

-- Enable RLS
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own ratings"
  ON public.user_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = rater_user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.user_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = rater_user_id);

CREATE POLICY "Users can view all ratings"
  ON public.user_ratings FOR SELECT TO authenticated
  USING (true);
```

## UI/UX Details

### RatePlayersScreen:
- **Header**: "Rate Experience" with back button
- **Venue Section**: 
  - Business icon with venue name
  - Current rating display
  - 5-star selector
  - Multi-line review text input
- **Players Section**:
  - Avatar (or initials)
  - Name with host badge if applicable
  - Current rating display
  - 5-star selector
- **Submit Button**:
  - Disabled until at least one rating given
  - Shows loading spinner while submitting
  - Returns to chat after success

### GameChatScreen Header:
```
[Back] [Sport Icon] [Sport - Court] [Stats Icon]
              [Status: Upcoming/Live]
```

## Integration Points

### Where Ratings Are Used:
1. **User Profiles** - `users.rating` field
2. **Venue Cards** - `venues.rating` field
3. **Search Results** - Sortable by rating
4. **Player Discovery** - Filter by skill level/rating
5. **Venue Rankings** - Leaderboards

### Queries to Display Ratings:

**Get user's average rating:**
```typescript
const { data: user } = await supabase
  .from('users')
  .select('rating')
  .eq('id', userId)
  .single();
// user.rating contains the average
```

**Get venue's average rating:**
```typescript
const { data: venue } = await supabase
  .from('venues')
  .select('rating')
  .eq('id', venueId)
  .single();
// venue.rating contains the average
```

**Get user's ratings given to others:**
```typescript
const { data: ratings } = await supabase
  .from('user_ratings')
  .select('rated_user_id, rating')
  .eq('rater_user_id', currentUserId);
```

**Get ratings received by a user:**
```typescript
const { data: ratings } = await supabase
  .from('user_ratings')
  .select('rater_user_id, rating, created_at')
  .eq('rated_user_id', targetUserId)
  .order('created_at', { ascending: false });
```

## Testing Checklist

- [ ] Run SQL migration to create user_ratings table
- [ ] Join a game and open game chat
- [ ] Click stats icon in chat header
- [ ] Verify all participants shown (except self)
- [ ] Verify host has badge
- [ ] Rate venue (5 stars + review)
- [ ] Rate each player (different star ratings)
- [ ] Submit ratings
- [ ] Verify success message
- [ ] Reopen rating screen - verify ratings preserved
- [ ] Change ratings and resubmit
- [ ] Check users table - verify rating column updated
- [ ] Check venues table - verify rating column updated
- [ ] Check user_ratings table - verify rows inserted/updated
- [ ] Test with multiple games and different players
- [ ] Verify ratings display on user profiles
- [ ] Verify ratings display on venue cards

## Future Enhancements

1. **Rating Categories** (optional):
   - Skill level
   - Sportsmanship
   - Communication
   - Punctuality

2. **Rating History**:
   - View all ratings given/received
   - Timeline of rating changes

3. **Rating Badges**:
   - "Top Rated Player"
   - "5-Star Venue"
   - "Great Sportsmanship"

4. **Rating Requirements**:
   - Must complete game to rate
   - Can't rate if game was cancelled
   - Time limit (e.g., within 7 days)

5. **Analytics**:
   - Rating trends over time
   - Venue comparison charts
   - Player improvement tracking

## Error Handling

- ✅ Loading states with spinners
- ✅ Graceful handling of missing data
- ✅ Alert on submission failure
- ✅ Prevents duplicate ratings (UNIQUE constraint)
- ✅ Prevents self-rating (CHECK constraint)
- ✅ Non-blocking chat errors (rating failure doesn't break chat)

## Logs to Watch

```
📊 [RATINGS] Submitting ratings...
✅ [RATINGS] Updated user [id] rating to 4.5
✅ [RATINGS] Updated venue [id] rating to 4.8
✅ [RATINGS] All ratings submitted successfully
```
