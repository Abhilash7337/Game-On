-- =====================================================
-- UPDATE BOOKING TRIGGER TO SET CHATROOM EXPIRY
-- =====================================================
-- This updates the existing trigger to automatically set
-- expires_at = booking_end_time + 1 hour when creating game chats
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_game_chat_on_booking_confirmation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conversation_id UUID;
    v_venue_name TEXT;
    v_court_name TEXT;
    v_booking_date DATE;
    v_booking_time TIME;
    v_booking_end_time TIMESTAMPTZ;
    v_duration INTERVAL;
    v_sport TEXT;
    v_host_id UUID;
    v_conversation_name TEXT;
BEGIN
    -- Only create game chat when booking is confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        RAISE NOTICE 'Creating game chat for confirmed booking %', NEW.id;
        
        -- Get booking details with venue and court info
        SELECT 
            v.name,
            c.name,
            b.booking_date,
            b.start_time,
            (b.end_time - b.start_time),
            c.type, -- Get sport type from court instead
            b.user_id,
            -- ✅ Calculate exact booking end timestamp
            (b.booking_date + b.start_time + (b.end_time - b.start_time))
        INTO 
            v_venue_name,
            v_court_name,
            v_booking_date,
            v_booking_time,
            v_duration,
            v_sport,
            v_host_id,
            v_booking_end_time
        FROM public.bookings b
        JOIN public.courts c ON c.id = b.court_id
        JOIN public.venues v ON v.id = c.venue_id
        WHERE b.id = NEW.id;
        
        -- Create conversation name
        v_conversation_name := v_venue_name || ' - ' || v_court_name || ' (' || TO_CHAR(v_booking_date, 'DD Mon') || ')';
        
        -- ✅ Log the expiry calculation
        RAISE NOTICE 'Booking ends at: %, Will expire at: %', 
            v_booking_end_time, 
            v_booking_end_time + INTERVAL '1 hour';
        
        -- Create the game chat conversation
        -- ✅ UPDATED: Now includes expires_at for auto-deletion
        INSERT INTO public.conversations (
            type,
            name,
            created_by,
            booking_id,
            expires_at,
            metadata,
            created_at,
            updated_at
        )
        VALUES (
            'game_chat',
            v_conversation_name,
            v_host_id,
            NEW.id,
            v_booking_end_time + INTERVAL '1 hour', -- ✅ Auto-delete 1 hour after booking ends
            jsonb_build_object(
                'booking_id', NEW.id,
                'venue', v_venue_name,
                'court', v_court_name,
                'date', v_booking_date::TEXT,
                'time', v_booking_time::TEXT,
                'duration', EXTRACT(EPOCH FROM v_duration) / 3600, -- hours
                'sport', v_sport,
                'booking_type', NEW.booking_type,
                'is_open_game', NEW.booking_type = 'open',
                'booking_end', v_booking_end_time::TEXT -- ✅ Store booking end time for reference
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
        
        RAISE NOTICE 'Created game chat % for booking % (expires at %)', 
            v_conversation_id, 
            NEW.id,
            v_booking_end_time + INTERVAL '1 hour';
        RAISE NOTICE 'Added host % to game chat', v_host_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger is already created, this just updates the function
-- The existing trigger will now use the updated function

COMMENT ON FUNCTION public.create_game_chat_on_booking_confirmation IS 
'Creates a game chat conversation when a booking is confirmed. 
Sets expires_at to 1 hour after the booking slot ends for automatic deletion.
Example: Booking 3pm-6pm on Nov 14 → expires_at = Nov 14 7pm';
