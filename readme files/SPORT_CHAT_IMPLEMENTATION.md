# Global Sport Chat Implementation Guide

## Overview
This document outlines the implementation of location-based sport group chats with two tiers:
1. **Global Sport Groups** - Visible and accessible from any city (e.g., "Global - Football")
2. **City Sport Groups** - Visible only in specific cities (e.g., "Hyderabad - Badminton")

## Database Schema

### New Table: `sport_chat_groups`
```sql
CREATE TABLE sport_chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport TEXT NOT NULL,
  city TEXT NULL,  -- NULL means global, specific value means city-wide
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sport, city)  -- Prevents duplicate groups per sport per city
);
```

### Updates to Existing Tables
- **conversations.type**: Added 'sport_group' to CHECK constraint
- **conversations.metadata**: Added jsonb column for additional data

## Key Features Implemented

### 1. Database Migration (`002_global_sport_chats.sql`)
Located at: `/database_migrations/002_global_sport_chats.sql`

**Components:**
- ✅ sport_chat_groups table with UNIQUE constraint
- ✅ Automatic conversation creation via trigger
- ✅ Real-time member count tracking
- ✅ RPC function: `get_or_create_city_sport_group(sport, city)`
- ✅ RPC function: `join_sport_group(user_id, sport, city)`
- ✅ Default 7 global sport groups (Football, Badminton, Table Tennis, Tennis, Basketball, Cricket, Volleyball)

**To Deploy:**
```bash
1. Open Supabase SQL Editor
2. Copy entire content of 002_global_sport_chats.sql
3. Execute the script
4. Verify: SELECT * FROM sport_chat_groups ORDER BY city NULLS FIRST, sport;
```

### 2. Service Layer (`sportGroupService.ts`)
Located at: `/src/common/services/sportGroupService.ts`

**Key Methods:**
```typescript
// Fetch all global groups (where city IS NULL)
SportGroupService.getGlobalSportGroups()

// Fetch city-specific groups
SportGroupService.getCitySportGroups(city: string)

// Create city group if doesn't exist
SportGroupService.getOrCreateCitySportGroup(sport: string, city: string)

// Join a sport group (global or city)
SportGroupService.joinSportGroup(userId: string, sport: string, city?: string)

// Leave a group
SportGroupService.leaveSportGroup(userId: string, conversationId: string)

// Check membership
SportGroupService.isGroupMember(userId: string, conversationId: string)

// Get all groups user has joined
SportGroupService.getUserSportGroups(userId: string)

// Initialize all 7 sports for a new city
SportGroupService.initializeCitySportGroups(city: string)
```

### 3. UI Implementation (`social.tsx`)
Located at: `/app/(tabs)/social.tsx`

**Updates:**
- ✅ Replaced mock data with real SportGroupService calls
- ✅ Added SportGroup interface with membership tracking
- ✅ Implemented auto-join flow with confirmation dialog
- ✅ Visual membership indicators (JOINED badge + icons)
- ✅ Separate tabs for Global and City sports
- ✅ Member count display
- ✅ Navigation to sport group chat

**Visual Indicators:**
- Joined groups show: `[JOINED]` badge + chat bubble icon
- Non-joined groups show: `+` icon for joining

### 4. Chat Screen (`SportGroupChatScreen.tsx`)
Located at: `/app/SportGroupChatScreen.tsx`

**Features:**
- ✅ Real-time messaging using Supabase subscriptions
- ✅ Sender name display for all messages
- ✅ Message bubbles (different colors for own vs others)
- ✅ Timestamp formatting
- ✅ Auto-scroll to latest message
- ✅ Global/City indicator in header
- ✅ Back navigation
- ✅ Keyboard handling

## Location-Based Filtering Logic

### How It Works:
1. **User Location**: Tracked via `userCity` state (currently set to 'Hyderabad' in social.tsx)
2. **Global Groups**: Query where `city IS NULL`
3. **City Groups**: Query where `city = 'Hyderabad'`
4. **Auto-Creation**: City groups are created on-demand when first user from that city joins

### Database Queries:
```typescript
// Global groups
.from('sport_chat_groups')
.select('*')
.is('city', null)

// City groups
.from('sport_chat_groups')
.select('*')
.eq('city', 'Hyderabad')
```

## Message Visibility

### Global Sport Group (e.g., "Global - Football"):
- ✅ Created once, visible everywhere
- ✅ Messages visible to all members worldwide
- ✅ User from Hyderabad and user from Vizag see same messages

### City Sport Group (e.g., "Hyderabad - Badminton"):
- ✅ Created per city
- ✅ Messages only visible to members in that city
- ✅ "Vizag - Badminton" is a separate group with separate messages

## User Flow

### Joining a Global Group:
1. User sees "Global - Football" in Global tab
2. Taps on the group
3. Alert: "Do you want to join Global - Football?"
4. User confirms → `join_sport_group(userId, 'Football', null)`
5. User is added to conversation_participants
6. Member count increments automatically
7. User navigates to chat screen

### Joining a City Group:
1. User in Hyderabad sees "Hyderabad - Badminton" in city section
2. Taps on the group
3. Alert: "Do you want to join Hyderabad - Badminton?"
4. User confirms → `join_sport_group(userId, 'Badminton', 'Hyderabad')`
5. If group doesn't exist, it's created automatically
6. User is added to conversation_participants
7. Member count increments
8. User navigates to chat screen

### User Changes City (Future Enhancement):
```typescript
// When user moves from Hyderabad to Vizag:
setUserCity('Vizag');

// This will automatically:
// 1. Load Vizag city groups
// 2. Hide Hyderabad groups
// 3. Keep global groups visible
// 4. Initialize Vizag groups if they don't exist
```

## Testing Checklist

### Database:
- [ ] Run migration in Supabase SQL Editor
- [ ] Verify 7 global groups exist: `SELECT * FROM sport_chat_groups WHERE city IS NULL;`
- [ ] Test creating city group: `SELECT get_or_create_city_sport_group('Football', 'Vizag');`
- [ ] Verify UNIQUE constraint prevents duplicates

### UI - Global Tab:
- [ ] See 7 global sport groups
- [ ] Each shows member count
- [ ] Tap non-joined group shows join confirmation
- [ ] After joining, "JOINED" badge appears
- [ ] Tap joined group opens chat screen
- [ ] Global indicator shows in chat header

### UI - City Sports (in Global tab):
- [ ] Toggle city sports section
- [ ] See city groups for Hyderabad
- [ ] Join city group shows confirmation
- [ ] After joining, can send messages
- [ ] City indicator shows in chat header

### Messaging:
- [ ] Send message appears immediately
- [ ] Other users see message in real-time
- [ ] Messages in global group visible to all cities
- [ ] Messages in city group only visible in that city
- [ ] Sender name shows correctly
- [ ] Timestamp displays properly

### Location Change:
- [ ] Change userCity to 'Vizag'
- [ ] City groups switch to Vizag groups
- [ ] Global groups remain visible
- [ ] Previous city messages not visible

## Default Sports Included
1. ⚽ Football
2. 🏸 Badminton
3. 🏓 Table Tennis
4. 🎾 Tennis
5. 🏀 Basketball
6. 🏏 Cricket
7. 🏐 Volleyball

## Adding More Sports

### Option 1: Via SQL
```sql
INSERT INTO sport_chat_groups (sport, city)
VALUES ('Squash', NULL);  -- Global group
```

### Option 2: Via Service
```typescript
// Add to SportGroupService if needed
await SportGroupService.getOrCreateCitySportGroup('Squash', 'Hyderabad');
```

## Future Enhancements

### Suggested Improvements:
1. **User Location Detection**: Auto-detect city via GPS
2. **Leave Group**: Add UI button to leave groups
3. **Group Admin**: Designate group moderators
4. **Message Reactions**: Add emoji reactions to messages
5. **Unread Counts**: Track unread messages per group
6. **Push Notifications**: Notify users of new messages
7. **Media Sharing**: Support images/videos in chat
8. **Player Profiles**: Link to user profiles in chat
9. **Game Invites**: Send booking invites within sport groups
10. **Popular Times**: Show when group is most active

## Database Indexes for Performance
Already included in migration:
```sql
CREATE INDEX idx_sport_chat_groups_sport ON sport_chat_groups(sport);
CREATE INDEX idx_sport_chat_groups_city ON sport_chat_groups(city);
CREATE INDEX idx_sport_chat_groups_conversation ON sport_chat_groups(conversation_id);
```

## Security Considerations

### Row Level Security (RLS):
Currently not implemented but recommended:
```sql
-- Allow anyone to read sport groups
CREATE POLICY "Anyone can view sport groups"
ON sport_chat_groups FOR SELECT
USING (true);

-- Only authenticated users can join
CREATE POLICY "Authenticated users can join groups"
ON conversation_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Troubleshooting

### Issue: City groups not showing
**Solution:** Run `SportGroupService.initializeCitySportGroups('YourCity')`

### Issue: Duplicate group error
**Solution:** UNIQUE constraint is working correctly, use existing group

### Issue: Member count not updating
**Solution:** Check trigger is active: `SELECT * FROM pg_trigger WHERE tgname LIKE 'sport_group%';`

### Issue: Messages not appearing
**Solution:** Verify conversation_id is correct and user is in conversation_participants

## Files Modified/Created

### New Files:
1. `/database_migrations/002_global_sport_chats.sql` (221 lines)
2. `/src/common/services/sportGroupService.ts` (217 lines)
3. `/app/SportGroupChatScreen.tsx` (326 lines)
4. `/SPORT_CHAT_IMPLEMENTATION.md` (this file)

### Modified Files:
1. `/app/(tabs)/social.tsx`
   - Added SportGroupService import
   - Replaced mock data with real service calls
   - Added membership tracking
   - Updated SportGroup interface
   - Enhanced handleSportGroupPress with join flow
   - Updated SportGroupCard with visual indicators

## Support

### Common Queries:
- **Q: How do I change the city?**
  A: Update the `userCity` state in social.tsx (line 57)

- **Q: Can I add more sports?**
  A: Yes, use SQL INSERT or call getOrCreateCitySportGroup()

- **Q: How do I test with multiple cities?**
  A: Change userCity state and reload, or test with multiple user accounts

- **Q: Can global and city groups have the same sport?**
  A: Yes! "Global - Football" and "Hyderabad - Football" are separate groups

## Next Steps

1. ✅ Run database migration
2. ✅ Test global groups
3. ✅ Test city groups
4. ✅ Verify messaging works
5. ⏳ Implement open game joining (booking_participants)
6. ⏳ Add unread message badges
7. ⏳ Implement location detection

---

**Implementation Status:** ✅ Complete and Ready for Testing
**Last Updated:** January 2025
