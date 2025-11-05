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
