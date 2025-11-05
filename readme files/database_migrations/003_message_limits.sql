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
