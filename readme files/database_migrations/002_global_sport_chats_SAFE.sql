-- ============================================
-- MIGRATION: Global and City-wide Sport Chats (SAFE VERSION)
-- Date: 2025-11-06
-- ============================================
-- This version includes safety checks and won't break existing data

-- STEP 1: Create sport_chat_groups table (completely new, won't affect existing tables)
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

-- STEP 2: Create indexes for fast queries (safe - only on new table)
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_sport ON public.sport_chat_groups(sport);
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_city ON public.sport_chat_groups(city);
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_conversation ON public.sport_chat_groups(conversation_id);

-- STEP 3: SAFELY update conversation type constraint
-- First check if 'sport_group' is already in the constraint
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
        
        RAISE NOTICE 'Added sport_group to conversation types';
    ELSE
        RAISE NOTICE 'sport_group already exists in conversation types - skipping';
    END IF;
END $$;

-- STEP 4: SAFELY add metadata column (won't affect existing rows)
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- STEP 5: Create function to automatically create conversations for sport groups
CREATE OR REPLACE FUNCTION create_sport_group_conversation()
RETURNS TRIGGER AS $$
DECLARE
    conv_id uuid;
    group_name text;
    system_user_id uuid;
BEGIN
    -- Get first user ID from public.users table (not auth.users)
    SELECT id INTO system_user_id FROM public.users LIMIT 1;
    
    -- If no users exist yet, we can't create conversations
    IF system_user_id IS NULL THEN
        RAISE EXCEPTION 'Cannot create sport group conversation: No users exist in the system yet. Please create a user account first, then re-run this migration.';
    END IF;

    -- Generate conversation name based on city
    IF NEW.city IS NULL THEN
        group_name := 'Global - ' || NEW.sport;
    ELSE
        group_name := NEW.city || ' - ' || NEW.sport;
    END IF;

    -- Create conversation
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

    -- Update sport_chat_groups with conversation_id
    NEW.conversation_id := conv_id;
    
    RAISE NOTICE 'Created conversation % for sport group %', conv_id, group_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Create trigger for automatic conversation creation
DROP TRIGGER IF EXISTS sport_group_conversation_trigger ON public.sport_chat_groups;
CREATE TRIGGER sport_group_conversation_trigger
    BEFORE INSERT ON public.sport_chat_groups
    FOR EACH ROW
    WHEN (NEW.conversation_id IS NULL)
    EXECUTE FUNCTION create_sport_group_conversation();

-- STEP 7: Create function to update member count
CREATE OR REPLACE FUNCTION update_sport_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment member count
        UPDATE public.sport_chat_groups
        SET member_count = member_count + 1,
            updated_at = now()
        WHERE conversation_id = NEW.conversation_id;
        RAISE NOTICE 'Incremented member count for conversation %', NEW.conversation_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement member count
        UPDATE public.sport_chat_groups
        SET member_count = GREATEST(member_count - 1, 0),
            updated_at = now()
        WHERE conversation_id = OLD.conversation_id;
        RAISE NOTICE 'Decremented member count for conversation %', OLD.conversation_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: Create trigger to update member count (only affects new sport_chat_groups)
DROP TRIGGER IF EXISTS sport_group_member_count_trigger ON public.conversation_participants;
CREATE TRIGGER sport_group_member_count_trigger
    AFTER INSERT OR DELETE ON public.conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_sport_group_member_count();

-- STEP 9: Insert default global sport groups (ON CONFLICT prevents duplicates)
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

-- STEP 10: Function to get or create city sport group
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
        RAISE NOTICE 'Created new city sport group: % - %', p_city, p_sport;
    END IF;

    RETURN group_id;
END;
$$ LANGUAGE plpgsql;

-- STEP 11: Function to join sport group
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

    RAISE NOTICE 'User % joined sport group %', p_user_id, v_conversation_id;
    RETURN jsonb_build_object('success', true, 'message', 'Joined successfully', 'conversation_id', v_conversation_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- STEP 12: Verify everything worked
DO $$
DECLARE
    group_count integer;
    global_count integer;
BEGIN
    -- Count total sport groups
    SELECT COUNT(*) INTO group_count FROM public.sport_chat_groups;
    SELECT COUNT(*) INTO global_count FROM public.sport_chat_groups WHERE city IS NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total sport groups created: %', group_count;
    RAISE NOTICE 'Global sport groups: %', global_count;
    RAISE NOTICE 'View groups: SELECT * FROM sport_chat_groups ORDER BY city NULLS FIRST, sport;';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- MANUAL VERIFICATION COMMANDS (Run these to test)
-- ============================================

-- View all sport groups
-- SELECT id, sport, city, member_count, conversation_id FROM public.sport_chat_groups ORDER BY city NULLS FIRST, sport;

-- View conversations created
-- SELECT id, type, name, metadata FROM public.conversations WHERE type = 'sport_group';

-- Test creating a city group
-- SELECT get_or_create_city_sport_group('Football', 'Hyderabad');

-- Test joining a global group (replace with your user ID)
-- SELECT join_sport_group(
--     'your-user-id-here'::uuid,
--     'Football',
--     NULL
-- );
