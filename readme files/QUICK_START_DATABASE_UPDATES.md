# 🚀 Quick Start - Essential Database Updates

## Copy-Paste Commands (Run in Supabase SQL Editor)

---

## ⚡ Critical Missing Columns

### 1. Users Table Updates
```sql
-- Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### 2. Venues Table Updates
```sql
-- Add missing columns to venues table
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS courts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### 3. Bookings Table Updates
```sql
-- Add missing columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '60 mins';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));

-- Update constraints
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_type_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_type_check 
    CHECK (booking_type IN ('private', 'public', 'open'));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'upcoming'));
```

---

## 📋 Essential New Tables

### 4. Notifications Table
```sql
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('booking', 'friend', 'chat', 'system', 'game_invite')) DEFAULT 'system',
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
```

### 5. User Stats Table
```sql
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_games INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    total_hours_played DECIMAL(10,2) DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    favorite_sport TEXT,
    skill_ratings JSONB DEFAULT '{}'::jsonb,
    achievements JSONB DEFAULT '[]'::jsonb,
    last_played_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON public.user_stats
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view friends' stats" ON public.user_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.friends 
            WHERE (user_id = auth.uid() AND friend_id = user_stats.user_id AND status = 'accepted')
            OR (friend_id = auth.uid() AND user_id = user_stats.user_id AND status = 'accepted')
        )
    );

-- Auto-create stats for new users
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_stats (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_stats_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE PROCEDURE create_user_stats();
```

### 6. Reviews Table
```sql
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    images TEXT[],
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(booking_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id AND user_id = auth.uid()
            AND status IN ('completed', 'confirmed')
        )
    );

CREATE INDEX idx_reviews_venue_id ON public.reviews(venue_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);

-- Auto-update venue rating when review is added
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.venues
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,1)
        FROM public.reviews WHERE venue_id = NEW.venue_id
    )
    WHERE id = NEW.venue_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_rating_trigger
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE update_venue_rating();
```

### 7. Game Invites Table
```sql
CREATE TABLE IF NOT EXISTS public.game_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(booking_id, invitee_id)
);

ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invites they sent or received" ON public.game_invites
    FOR SELECT USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

CREATE POLICY "Users can create game invites" ON public.game_invites
    FOR INSERT WITH CHECK (inviter_id = auth.uid());

CREATE INDEX idx_game_invites_invitee_id ON public.game_invites(invitee_id);
CREATE INDEX idx_game_invites_status ON public.game_invites(status);
```

---

## 🔍 Verification Commands

### Check All Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check Users Table Columns
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
```

### Check Venues Table Columns
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'venues'
ORDER BY ordinal_position;
```

### Check Bookings Table Columns
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
ORDER BY ordinal_position;
```

---

## ✅ Expected Tables After Migration

You should have these tables in your `public` schema:
1. ✅ users
2. ✅ clients  
3. ✅ venues
4. ✅ courts
5. ✅ time_slots
6. ✅ bookings
7. ✅ booking_participants
8. ✅ friends
9. ✅ conversations
10. ✅ conversation_participants
11. ✅ messages
12. ✅ user_presence
13. ✅ **notifications** (new)
14. ✅ **user_stats** (new)
15. ✅ **reviews** (new)
16. ✅ **game_invites** (new)

---

## 🎯 What Each Addition Does

| Addition | Purpose | Impact |
|----------|---------|--------|
| **users.location** | User's city/area | Enables location-based venue search |
| **users.avatar** | Profile picture URL | Enables user avatars in UI |
| **users.rating** | Skill rating | Enables skill-based matchmaking |
| **venues.location** | GPS coordinates | Enables map view and distance calculation |
| **venues.rating** | Venue quality rating | Enables venue ranking and reviews |
| **bookings.payment_status** | Payment tracking | Enables payment flow management |
| **notifications table** | Push notifications | Enables in-app notification system |
| **user_stats table** | User statistics | Enables leaderboards and achievements |
| **reviews table** | Venue reviews | Enables rating and review system |
| **game_invites table** | Game invitations | Enables friend game invites |

---

## ⚠️ Important Notes

1. **Run commands in order** - Some commands depend on previous ones
2. **Backup first** - Create a database backup before running
3. **Check errors** - Review any error messages carefully
4. **Test after** - Verify your app works with the new schema
5. **Safe to re-run** - Commands use `IF NOT EXISTS` so they're idempotent

---

## 🆘 If Something Goes Wrong

### Error: "column already exists"
✅ **Safe to ignore** - Column was already added

### Error: "relation already exists"  
✅ **Safe to ignore** - Table already exists

### Error: "permission denied"
❌ **Action needed** - Run as database owner or superuser

### Error: "constraint violation"
❌ **Action needed** - Existing data may need cleanup before adding constraint

---

## 📚 For More Details

See the complete documentation in:
- `DATABASE_MIGRATION_SUMMARY.md` - Full explanation of all changes
- `database-migration-updates.sql` - Complete migration script with all features

---

**Last Updated:** November 5, 2025  
**Version:** 1.0 - Quick Start Edition
