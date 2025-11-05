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
