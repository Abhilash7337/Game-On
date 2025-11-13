5th NOV:

-- Open Supabase Dashboard → SQL Editor → Paste this:

-- Users table - needed for profiles
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Venues table - needed for map and location features
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Bookings table - needed for open games and payments
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '60 mins';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Update booking type constraint to allow 'open' games
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_type_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_type_check 
    CHECK (booking_type IN ('private', 'public', 'open'));



CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_games INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    favorite_sport TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



-- ============================================
-- MIGRATION: Add game chat support
-- ============================================

-- 1. Add booking_id to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON public.conversations(booking_id);

-- 3. Update conversation type constraint
ALTER TABLE public.conversations 
DROP CONSTRAINT IF EXISTS conversations_type_check;

ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_type_check 
CHECK (type IN ('direct', 'group', 'game_chat'));

-- 4. Add index on booking_type for faster open game queries
CREATE INDEX IF NOT EXISTS idx_bookings_type_status 
ON public.bookings(booking_type, status) 
WHERE booking_type = 'open' AND status = 'confirmed';

-- 5. Add index on booking_participants for count queries
CREATE INDEX IF NOT EXISTS idx_booking_participants_booking_id 
ON public.booking_participants(booking_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify booking_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations' AND column_name = 'booking_id';

-- Verify constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'conversations_type_check';


-- ============================================
-- MIGRATION: Global and City-wide Sport Chats (NO USER REQUIRED)
-- Date: 2025-11-06
-- This version works even without any users in the system
-- ============================================

-- STEP 1: Create sport_chat_groups table
CREATE TABLE IF NOT EXISTS public.sport_chat_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sport text NOT NULL,
    city text DEFAULT NULL, -- NULL means global, otherwise city-specific
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    member_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(sport, city) -- One group per sport per city (or global)
);

-- STEP 2: Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_sport ON public.sport_chat_groups(sport);
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_city ON public.sport_chat_groups(city);
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_conversation ON public.sport_chat_groups(conversation_id);

-- STEP 3: Check if created_by is nullable, if not, make it nullable temporarily
DO $$
BEGIN
    -- Check if created_by column exists and is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND column_name = 'created_by' 
        AND is_nullable = 'NO'
    ) THEN
        -- Make created_by nullable temporarily for system conversations
        ALTER TABLE public.conversations ALTER COLUMN created_by DROP NOT NULL;
        RAISE NOTICE 'Made conversations.created_by nullable for system conversations';
    END IF;
END $$;

-- STEP 4: SAFELY update conversation type constraint
DO $$
BEGIN
    -- Only modify if sport_group is not already allowed
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'conversations_type_check' 
        AND conbin::text LIKE '%sport_group%'
    ) THEN
        -- Drop old constraint
        ALTER TABLE public.conversations 
        DROP CONSTRAINT IF EXISTS conversations_type_check;
        
        -- Add new constraint with sport_group
        ALTER TABLE public.conversations 
        ADD CONSTRAINT conversations_type_check 
        CHECK (type IN ('direct', 'group', 'game_chat', 'sport_group'));
        
        RAISE NOTICE '✅ Added sport_group to conversation types';
    ELSE
        RAISE NOTICE 'ℹ️ sport_group already exists in conversation types - skipping';
    END IF;
END $$;

-- STEP 5: SAFELY add metadata column
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- STEP 6: Create function to automatically create conversations for sport groups
CREATE OR REPLACE FUNCTION create_sport_group_conversation()
RETURNS TRIGGER AS $$
DECLARE
    conv_id uuid;
    group_name text;
    system_user_id uuid;
BEGIN
    -- Try to get a user ID from public.users
    SELECT id INTO system_user_id FROM public.users LIMIT 1;
    
    -- Generate conversation name
    IF NEW.city IS NULL THEN
        group_name := 'Global - ' || NEW.sport;
    ELSE
        group_name := NEW.city || ' - ' || NEW.sport;
    END IF;

    -- Create conversation (with or without user ID)
    IF system_user_id IS NOT NULL THEN
        -- Normal case: user exists
        INSERT INTO public.conversations (type, name, created_by, metadata, created_at, updated_at)
        VALUES (
            'sport_group',
            group_name,
            system_user_id,
            jsonb_build_object('sport', NEW.sport, 'city', NEW.city, 'is_global', NEW.city IS NULL),
            now(),
            now()
        )
        RETURNING id INTO conv_id;
    ELSE
        -- No users yet: create system conversation without created_by
        INSERT INTO public.conversations (type, name, created_by, metadata, created_at, updated_at)
        VALUES (
            'sport_group',
            group_name,
            NULL, -- System conversation
            jsonb_build_object('sport', NEW.sport, 'city', NEW.city, 'is_global', NEW.city IS NULL, 'system', true),
            now(),
            now()
        )
        RETURNING id INTO conv_id;
        RAISE NOTICE 'Created system conversation without user (ID: %)', conv_id;
    END IF;

    -- Update sport_chat_groups with conversation_id
    NEW.conversation_id := conv_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Create trigger for automatic conversation creation
DROP TRIGGER IF EXISTS sport_group_conversation_trigger ON public.sport_chat_groups;
CREATE TRIGGER sport_group_conversation_trigger
    BEFORE INSERT ON public.sport_chat_groups
    FOR EACH ROW
    WHEN (NEW.conversation_id IS NULL)
    EXECUTE FUNCTION create_sport_group_conversation();

-- STEP 8: Create function to update member count
CREATE OR REPLACE FUNCTION update_sport_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment member count
        UPDATE public.sport_chat_groups
        SET member_count = member_count + 1,
            updated_at = now()
        WHERE conversation_id = NEW.conversation_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement member count
        UPDATE public.sport_chat_groups
        SET member_count = GREATEST(member_count - 1, 0),
            updated_at = now()
        WHERE conversation_id = OLD.conversation_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Create trigger to update member count
DROP TRIGGER IF EXISTS sport_group_member_count_trigger ON public.conversation_participants;
CREATE TRIGGER sport_group_member_count_trigger
    AFTER INSERT OR DELETE ON public.conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_sport_group_member_count();

-- STEP 10: Insert default global sport groups
INSERT INTO public.sport_chat_groups (sport, city, created_at, updated_at)
VALUES 
    ('Football', NULL, now(), now()),
    ('Badminton', NULL, now(), now()),
    ('Table Tennis', NULL, now(), now()),
    ('Tennis', NULL, now(), now()),
    ('Basketball', NULL, now(), now()),
    ('Cricket', NULL, now(), now()),
    ('Volleyball', NULL, now(), now())
ON CONFLICT (sport, city) DO NOTHING;

-- STEP 11: Function to get or create city sport group
CREATE OR REPLACE FUNCTION get_or_create_city_sport_group(
    p_sport text,
    p_city text
)
RETURNS uuid AS $$
DECLARE
    group_id uuid;
BEGIN
    -- Try to get existing group
    SELECT id INTO group_id
    FROM public.sport_chat_groups
    WHERE sport = p_sport AND city = p_city;

    -- Create if doesn't exist
    IF group_id IS NULL THEN
        INSERT INTO public.sport_chat_groups (sport, city, created_at, updated_at)
        VALUES (p_sport, p_city, now(), now())
        RETURNING id INTO group_id;
    END IF;

    RETURN group_id;
END;
$$ LANGUAGE plpgsql;

-- STEP 12: Function to join sport group
CREATE OR REPLACE FUNCTION join_sport_group(
    p_user_id uuid,
    p_sport text,
    p_city text DEFAULT NULL -- NULL for global groups
)
RETURNS jsonb AS $$
DECLARE
    v_conversation_id uuid;
    v_already_member boolean;
BEGIN
    -- Get conversation_id for the sport group
    SELECT conversation_id INTO v_conversation_id
    FROM public.sport_chat_groups
    WHERE sport = p_sport 
        AND (
            (p_city IS NULL AND city IS NULL) OR 
            (city = p_city)
        );

    IF v_conversation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sport group not found');
    END IF;

    -- Check if already a member
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = v_conversation_id AND user_id = p_user_id
    ) INTO v_already_member;

    IF v_already_member THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already a member', 'conversation_id', v_conversation_id);
    END IF;

    -- Add user to conversation_participants
    INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, is_active)
    VALUES (v_conversation_id, p_user_id, now(), true);

    RETURN jsonb_build_object('success', true, 'message', 'Joined successfully', 'conversation_id', v_conversation_id);
END;
$$ LANGUAGE plpgsql;

-- STEP 13: Verify everything worked
DO $$
DECLARE
    group_count integer;
    global_count integer;
    conv_count integer;
BEGIN
    -- Count sport groups
    SELECT COUNT(*) INTO group_count FROM public.sport_chat_groups;
    SELECT COUNT(*) INTO global_count FROM public.sport_chat_groups WHERE city IS NULL;
    SELECT COUNT(*) INTO conv_count FROM public.conversations WHERE type = 'sport_group';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total sport groups: %', group_count;
    RAISE NOTICE 'Global sport groups: %', global_count;
    RAISE NOTICE 'Conversations created: %', conv_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'View groups: SELECT * FROM sport_chat_groups ORDER BY city NULLS FIRST;';
    RAISE NOTICE 'View conversations: SELECT id, name, type FROM conversations WHERE type = ''sport_group'';';
    RAISE NOTICE '========================================';
END $$;




-- ============================================
-- MESSAGE LIMITS for Sport Group Chats
-- Prevents database bloat by keeping only recent messages
-- ============================================

-- RECOMMENDED LIMITS:
-- Global Groups: 500 messages (high traffic expected)
-- City Groups: 300 messages (moderate traffic)
-- Game Chats: 200 messages (temporary, expires after game)

-- Function to clean old messages from sport groups
CREATE OR REPLACE FUNCTION cleanup_old_sport_group_messages()
RETURNS void AS $$
DECLARE
    v_conversation record;
    v_is_global boolean;
    v_message_limit integer;
    v_deleted_count integer := 0;
BEGIN
    -- Loop through all sport group conversations
    FOR v_conversation IN 
        SELECT c.id, c.metadata
        FROM public.conversations c
        WHERE c.type = 'sport_group'
    LOOP
        -- Determine if global or city group
        v_is_global := (v_conversation.metadata->>'is_global')::boolean;
        
        -- Set limit based on group type
        IF v_is_global THEN
            v_message_limit := 500; -- Global groups (high traffic)
        ELSE
            v_message_limit := 300; -- City groups (moderate traffic)
        END IF;
        
        -- Delete old messages, keeping only the most recent
        WITH messages_to_delete AS (
            SELECT id
            FROM public.messages
            WHERE conversation_id = v_conversation.id
            ORDER BY created_at DESC
            OFFSET v_message_limit
        )
        DELETE FROM public.messages
        WHERE id IN (SELECT id FROM messages_to_delete);
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        IF v_deleted_count > 0 THEN
            RAISE NOTICE 'Cleaned % old messages from conversation %', v_deleted_count, v_conversation.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Sport group message cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Function to clean old messages from game chats
CREATE OR REPLACE FUNCTION cleanup_old_game_chat_messages()
RETURNS void AS $$
DECLARE
    v_conversation_id uuid;
    v_deleted_count integer := 0;
    v_message_limit integer := 200; -- Game chats: 200 messages
BEGIN
    -- Loop through all game chat conversations
    FOR v_conversation_id IN 
        SELECT id FROM public.conversations WHERE type = 'game_chat'
    LOOP
        -- Delete old messages, keeping only the most recent
        WITH messages_to_delete AS (
            SELECT id
            FROM public.messages
            WHERE conversation_id = v_conversation_id
            ORDER BY created_at DESC
            OFFSET v_message_limit
        )
        DELETE FROM public.messages
        WHERE id IN (SELECT id FROM messages_to_delete);
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        IF v_deleted_count > 0 THEN
            RAISE NOTICE 'Cleaned % old messages from game chat %', v_deleted_count, v_conversation_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Game chat message cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Automatic cleanup trigger - runs after every 50 messages
CREATE OR REPLACE FUNCTION auto_cleanup_messages_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_message_count integer;
    v_conversation_type text;
    v_is_global boolean;
    v_limit integer;
BEGIN
    -- Get conversation type
    SELECT type, metadata->>'is_global' 
    INTO v_conversation_type, v_is_global
    FROM public.conversations 
    WHERE id = NEW.conversation_id;
    
    -- Only cleanup for sport_group and game_chat types
    IF v_conversation_type NOT IN ('sport_group', 'game_chat') THEN
        RETURN NEW;
    END IF;
    
    -- Count messages in this conversation
    SELECT COUNT(*) INTO v_message_count
    FROM public.messages
    WHERE conversation_id = NEW.conversation_id;
    
    -- Set limit based on type
    IF v_conversation_type = 'sport_group' THEN
        IF v_is_global::boolean THEN
            v_limit := 500; -- Global sport groups
        ELSE
            v_limit := 300; -- City sport groups
        END IF;
    ELSIF v_conversation_type = 'game_chat' THEN
        v_limit := 200; -- Game chats
    END IF;
    
    -- If over limit, delete oldest messages
    IF v_message_count > v_limit THEN
        DELETE FROM public.messages
        WHERE id IN (
            SELECT id FROM public.messages
            WHERE conversation_id = NEW.conversation_id
            ORDER BY created_at ASC
            LIMIT (v_message_count - v_limit)
        );
        
        RAISE NOTICE 'Auto-cleaned % excess messages from conversation %', (v_message_count - v_limit), NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic cleanup
DROP TRIGGER IF EXISTS auto_cleanup_messages ON public.messages;
CREATE TRIGGER auto_cleanup_messages
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_cleanup_messages_trigger();

-- Schedule manual cleanup (run this periodically via cron or scheduler)
-- Recommended: Run once daily at off-peak hours
-- Example cron: 0 3 * * * (3 AM daily)

-- To manually run cleanup:
-- SELECT cleanup_old_sport_group_messages();
-- SELECT cleanup_old_game_chat_messages();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check message counts per conversation
-- SELECT 
--     c.type,
--     c.name,
--     c.metadata->>'is_global' as is_global,
--     COUNT(m.id) as message_count
-- FROM public.conversations c
-- LEFT JOIN public.messages m ON m.conversation_id = c.id
-- WHERE c.type IN ('sport_group', 'game_chat')
-- GROUP BY c.id, c.type, c.name, c.metadata
-- ORDER BY message_count DESC;

-- Verification message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MESSAGE LIMITS CONFIGURED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Global Sport Groups: 500 messages max';
    RAISE NOTICE 'City Sport Groups: 300 messages max';
    RAISE NOTICE 'Game Chats: 200 messages max';
    RAISE NOTICE 'Auto-cleanup trigger: ACTIVE';
    RAISE NOTICE '========================================';
END $$;




-- ============================================
-- AUTO-CREATE GAME CHATS
-- Automatically creates game chat when booking is confirmed
-- Automatically adds users to game chat when they join open games
-- ============================================

-- STEP 1: Function to create game chat when booking is confirmed
CREATE OR REPLACE FUNCTION create_game_chat_on_booking_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id uuid;
    v_conversation_name text;
    v_venue_name text;
    v_court_name text;
    v_booking_date date;
    v_booking_time time;
    v_duration interval;
    v_sport text;
    v_host_id uuid;
    v_existing_conversation_id uuid;
BEGIN
    -- Only proceed if status changed to 'confirmed' and no conversation exists yet
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        
        -- Check if game chat already exists for this booking
        SELECT id INTO v_existing_conversation_id
        FROM public.conversations
        WHERE booking_id = NEW.id AND type = 'game_chat';
        
        IF v_existing_conversation_id IS NOT NULL THEN
            RAISE NOTICE 'Game chat already exists for booking %', NEW.id;
            RETURN NEW;
        END IF;
        
        -- Get booking details with venue and court info
        SELECT 
            v.name,
            c.name,
            b.booking_date,
            b.start_time,
            (b.end_time - b.start_time),
            v.sports[1], -- Get first sport from venue
            b.user_id
        INTO 
            v_venue_name,
            v_court_name,
            v_booking_date,
            v_booking_time,
            v_duration,
            v_sport,
            v_host_id
        FROM public.bookings b
        JOIN public.courts c ON c.id = b.court_id
        JOIN public.venues v ON v.id = c.venue_id
        WHERE b.id = NEW.id;
        
        -- Create conversation name
        v_conversation_name := v_venue_name || ' - ' || v_court_name || ' (' || TO_CHAR(v_booking_date, 'DD Mon') || ')';
        
        -- Create the game chat conversation
        INSERT INTO public.conversations (
            type,
            name,
            created_by,
            booking_id,
            metadata,
            created_at,
            updated_at
        )
        VALUES (
            'game_chat',
            v_conversation_name,
            v_host_id,
            NEW.id,
            jsonb_build_object(
                'booking_id', NEW.id,
                'venue', v_venue_name,
                'court', v_court_name,
                'date', v_booking_date,
                'time', v_booking_time,
                'duration', EXTRACT(EPOCH FROM v_duration) / 3600, -- hours
                'sport', v_sport,
                'booking_type', NEW.booking_type,
                'is_open_game', NEW.booking_type = 'open'
            ),
            now(),
            now()
        )
        RETURNING id INTO v_conversation_id;
        
        -- Add the host (booking creator) to the conversation
        INSERT INTO public.conversation_participants (
            conversation_id,
            user_id,
            joined_at,
            is_active
        )
        VALUES (
            v_conversation_id,
            v_host_id,
            now(),
            true
        )
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Created game chat % for booking %', v_conversation_id, NEW.id;
        RAISE NOTICE 'Added host % to game chat', v_host_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Create trigger for automatic game chat creation
DROP TRIGGER IF EXISTS auto_create_game_chat ON public.bookings;
CREATE TRIGGER auto_create_game_chat
    AFTER INSERT OR UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_game_chat_on_booking_confirmation();

-- STEP 3: Function to add user to game chat when they join booking
CREATE OR REPLACE FUNCTION add_user_to_game_chat_on_join()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id uuid;
    v_booking_id uuid;
    v_already_participant boolean;
BEGIN
    -- Only proceed for confirmed bookings
    IF NEW.status = 'confirmed' THEN
        
        -- Get the booking_id
        v_booking_id := NEW.booking_id;
        
        -- Find the game chat conversation for this booking
        SELECT id INTO v_conversation_id
        FROM public.conversations
        WHERE booking_id = v_booking_id AND type = 'game_chat';
        
        IF v_conversation_id IS NULL THEN
            RAISE NOTICE 'No game chat found for booking %, will be created on confirmation', v_booking_id;
            RETURN NEW;
        END IF;
        
        -- Check if user is already a participant
        SELECT EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = v_conversation_id AND user_id = NEW.user_id
        ) INTO v_already_participant;
        
        IF v_already_participant THEN
            RAISE NOTICE 'User % already in game chat %', NEW.user_id, v_conversation_id;
            RETURN NEW;
        END IF;
        
        -- Add user to the game chat conversation
        INSERT INTO public.conversation_participants (
            conversation_id,
            user_id,
            joined_at,
            is_active
        )
        VALUES (
            v_conversation_id,
            NEW.user_id,
            now(),
            true
        )
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Added user % to game chat % for booking %', NEW.user_id, v_conversation_id, v_booking_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Create trigger to add users to game chat when they join
DROP TRIGGER IF EXISTS auto_add_to_game_chat ON public.booking_participants;
CREATE TRIGGER auto_add_to_game_chat
    AFTER INSERT OR UPDATE OF status ON public.booking_participants
    FOR EACH ROW
    EXECUTE FUNCTION add_user_to_game_chat_on_join();

-- STEP 5: Function to remove user from game chat when they leave/cancel
CREATE OR REPLACE FUNCTION remove_user_from_game_chat_on_leave()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Only proceed if status changed to cancelled or rejected
    IF NEW.status IN ('cancelled', 'rejected') AND OLD.status != NEW.status THEN
        
        -- Find the game chat conversation
        SELECT id INTO v_conversation_id
        FROM public.conversations
        WHERE booking_id = NEW.booking_id AND type = 'game_chat';
        
        IF v_conversation_id IS NOT NULL THEN
            -- Mark user as inactive in conversation (don't delete, keep message history)
            UPDATE public.conversation_participants
            SET is_active = false,
                updated_at = now()
            WHERE conversation_id = v_conversation_id 
            AND user_id = NEW.user_id;
            
            RAISE NOTICE 'Removed user % from game chat %', NEW.user_id, v_conversation_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Create trigger to remove users when they leave
DROP TRIGGER IF EXISTS auto_remove_from_game_chat ON public.booking_participants;
CREATE TRIGGER auto_remove_from_game_chat
    AFTER UPDATE OF status ON public.booking_participants
    FOR EACH ROW
    EXECUTE FUNCTION remove_user_from_game_chat_on_leave();

-- STEP 7: Backfill existing confirmed bookings (create game chats for them)
DO $$
DECLARE
    v_booking record;
    v_created_count integer := 0;
BEGIN
    -- Loop through all confirmed bookings that don't have game chats
    FOR v_booking IN 
        SELECT b.id, b.status, b.user_id
        FROM public.bookings b
        WHERE b.status = 'confirmed'
        AND NOT EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.booking_id = b.id AND c.type = 'game_chat'
        )
    LOOP
        -- Trigger the function by updating the booking (no actual change)
        UPDATE public.bookings
        SET updated_at = now()
        WHERE id = v_booking.id;
        
        v_created_count := v_created_count + 1;
    END LOOP;
    
    IF v_created_count > 0 THEN
        RAISE NOTICE 'Created game chats for % existing confirmed bookings', v_created_count;
    ELSE
        RAISE NOTICE 'No existing bookings need game chats';
    END IF;
END $$;

-- STEP 8: Add all confirmed booking participants to their game chats
DO $$
DECLARE
    v_participant record;
    v_added_count integer := 0;
BEGIN
    -- Loop through all confirmed booking participants
    FOR v_participant IN 
        SELECT bp.id, bp.booking_id, bp.user_id, bp.status
        FROM public.booking_participants bp
        WHERE bp.status = 'confirmed'
    LOOP
        -- Trigger the function
        UPDATE public.booking_participants
        SET updated_at = now()
        WHERE id = v_participant.id;
        
        v_added_count := v_added_count + 1;
    END LOOP;
    
    IF v_added_count > 0 THEN
        RAISE NOTICE 'Added % existing participants to their game chats', v_added_count;
    ELSE
        RAISE NOTICE 'No existing participants to add';
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
    game_chat_count integer;
    booking_count integer;
BEGIN
    -- Count game chats
    SELECT COUNT(*) INTO game_chat_count 
    FROM public.conversations 
    WHERE type = 'game_chat';
    
    -- Count confirmed bookings
    SELECT COUNT(*) INTO booking_count 
    FROM public.bookings 
    WHERE status = 'confirmed';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ AUTO GAME CHAT SYSTEM ACTIVE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Existing game chats: %', game_chat_count;
    RAISE NOTICE 'Confirmed bookings: %', booking_count;
    RAISE NOTICE '';
    RAISE NOTICE '📋 Features Enabled:';
    RAISE NOTICE '✅ Auto-create game chat when booking confirmed';
    RAISE NOTICE '✅ Auto-add users when they join open games';
    RAISE NOTICE '✅ Auto-remove users when they cancel';
    RAISE NOTICE '✅ Host automatically added to game chat';
    RAISE NOTICE '✅ Previous messages visible to new joiners';
    RAISE NOTICE '========================================';
END $$;

-- Manual verification queries:
-- 
-- View all game chats:
-- SELECT c.id, c.name, c.booking_id, c.metadata->>'venue' as venue, c.metadata->>'court' as court
-- FROM conversations c WHERE c.type = 'game_chat';
--
-- View participants in a game chat:
-- SELECT cp.user_id, u.full_name, cp.joined_at, cp.is_active
-- FROM conversation_participants cp
-- JOIN users u ON u.id = cp.user_id
-- WHERE cp.conversation_id = 'YOUR_CONVERSATION_ID';
--
-- Test: Create a new booking and confirm it
-- INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, booking_type, status)
-- VALUES ('YOUR_USER_ID', 'COURT_ID', CURRENT_DATE + 1, '10:00', '11:00', 'open', 'confirmed');





-- Drop existing policy if any
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.booking_participants;

-- Create new policy allowing authenticated users to insert their own participant records
CREATE POLICY "Enable insert for authenticated users"
ON public.booking_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);



CREATE OR REPLACE FUNCTION public.create_game_chat_on_booking_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_conversation_id uuid;
    v_conversation_name text;
    v_venue_name text;
    v_court_name text;
    v_booking_date date;
    v_booking_time time;
    v_duration interval;
    v_sport text;
    v_host_id uuid;
    v_existing_conversation_id uuid;
BEGIN
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        
        SELECT id INTO v_existing_conversation_id
        FROM public.conversations
        WHERE booking_id = NEW.id AND type = 'game_chat';
        
        IF v_existing_conversation_id IS NOT NULL THEN
            RAISE NOTICE 'Game chat already exists for booking %', NEW.id;
            RETURN NEW;
        END IF;
        
        SELECT 
            v.name,
            c.name,
            b.booking_date,
            b.start_time,
            (b.end_time - b.start_time),
            c.type, -- ✅ ONLY CHANGE: Get sport from court.type
            b.user_id
        INTO 
            v_venue_name,
            v_court_name,
            v_booking_date,
            v_booking_time,
            v_duration,
            v_sport,
            v_host_id
        FROM public.bookings b
        JOIN public.courts c ON c.id = b.court_id
        JOIN public.venues v ON v.id = c.venue_id
        WHERE b.id = NEW.id;
        
        v_conversation_name := v_venue_name || ' - ' || v_court_name || ' (' || TO_CHAR(v_booking_date, 'DD Mon') || ')';
        
        INSERT INTO public.conversations (
            type,
            name,
            created_by,
            booking_id,
            metadata,
            created_at,
            updated_at
        )
        VALUES (
            'game_chat',
            v_conversation_name,
            v_host_id,
            NEW.id,
            jsonb_build_object(
                'booking_id', NEW.id,
                'venue', v_venue_name,
                'court', v_court_name,
                'date', v_booking_date,
                'time', v_booking_time,
                'duration', EXTRACT(EPOCH FROM v_duration) / 3600,
                'sport', v_sport,
                'booking_type', NEW.booking_type,
                'is_open_game', NEW.booking_type = 'open'
            ),
            now(),
            now()
        )
        RETURNING id INTO v_conversation_id;
        
        INSERT INTO public.conversation_participants (
            conversation_id,
            user_id,
            joined_at,
            is_active
        )
        VALUES (
            v_conversation_id,
            v_host_id,
            now(),
            true
        )
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Created game chat % for booking %', v_conversation_id, NEW.id;
        RAISE NOTICE 'Added host % to game chat', v_host_id;
    END IF;
    
    RETURN NEW;
END;
$function$;



-- Create user_ratings table to track player ratings
-- Run this in your Supabase SQL Editor

-- Create user_ratings table
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate ratings (one user can only rate another once)
  UNIQUE(rater_user_id, rated_user_id),
  
  -- Prevent self-rating
  CHECK (rater_user_id != rated_user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater ON public.user_ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated ON public.user_ratings(rated_user_id);

-- Enable RLS
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_ratings
CREATE POLICY "Users can insert their own ratings"
  ON public.user_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rater_user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.user_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = rater_user_id);

CREATE POLICY "Users can view all ratings"
  ON public.user_ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE public.user_ratings IS 'Stores ratings between users after playing together';

COMMENT ON COLUMN public.user_ratings.rater_user_id IS 'User who is giving the rating';
COMMENT ON COLUMN public.user_ratings.rated_user_id IS 'User who is being rated';
COMMENT ON COLUMN public.user_ratings.rating IS 'Rating value from 1-5 stars';



-- Fix RLS policies for cross-device booking visibility
-- Run these commands in your Supabase SQL Editor

-- 1. First, check existing policies on bookings table
SELECT * FROM pg_policies WHERE tablename = 'bookings';

-- 2. Drop the restrictive SELECT policy (if it exists)
-- Replace 'policy_name_here' with the actual policy name from step 1
-- Common names: "Users can view their own bookings", "Enable read for users", etc.
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.bookings;
DROP POLICY IF EXISTS "Users can only see own bookings" ON public.bookings;

-- 3. Create a new policy that allows ALL authenticated users to see ALL bookings
CREATE POLICY "Enable read access for all authenticated users" 
ON public.bookings
FOR SELECT
TO authenticated
USING (true);

-- 4. Also check and fix the booking_participants table
SELECT * FROM pg_policies WHERE tablename = 'booking_participants';

-- 5. Allow all authenticated users to see all participants
DROP POLICY IF EXISTS "Users can view their own participants" ON public.booking_participants;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.booking_participants;

CREATE POLICY "Enable read access for all authenticated users" 
ON public.booking_participants
FOR SELECT
TO authenticated
USING (true);

-- 6. Verify the new policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_participants')
ORDER BY tablename, policyname;



-- Fix RLS policies for cross-device booking visibility
-- ISSUE FOUND: "Users can read own bookings" policy is restricting access
-- SOLUTION: Drop the conflicting restrictive policy

-- Drop the conflicting restrictive SELECT policy on bookings table
DROP POLICY IF EXISTS "Users can read own bookings" ON public.bookings;

-- Drop the conflicting restrictive SELECT policy on booking_participants table  
DROP POLICY IF EXISTS "Users can view their booking participants" ON public.booking_participants;

-- Verify the policies after cleanup
-- You should now ONLY have:
-- - "Enable read access for all authenticated users" (for both tables)
-- - "Venue owners can read bookings for their venues" (for bookings)
-- - INSERT/UPDATE policies (those are fine)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_participants')
ORDER BY tablename, policyname;
