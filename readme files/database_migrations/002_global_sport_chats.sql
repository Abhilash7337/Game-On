-- ============================================
-- MIGRATION: Global and City-wide Sport Chats
-- Date: 2025-11-06
-- ============================================

-- 1. Create sport_chat_groups table
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

-- 2. Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_sport ON public.sport_chat_groups(sport);
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_city ON public.sport_chat_groups(city);
CREATE INDEX IF NOT EXISTS idx_sport_chat_groups_conversation ON public.sport_chat_groups(conversation_id);

-- 3. Add 'sport_group' to conversation types
ALTER TABLE public.conversations 
DROP CONSTRAINT IF EXISTS conversations_type_check;

ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_type_check 
CHECK (type IN ('direct', 'group', 'game_chat', 'sport_group'));

-- 4. Add metadata to conversations for sport info
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 5. Create function to automatically create conversations for sport groups
CREATE OR REPLACE FUNCTION create_sport_group_conversation()
RETURNS TRIGGER AS $$
DECLARE
    conv_id uuid;
    group_name text;
    system_user_id uuid;
BEGIN
    -- Get a valid user ID from users table (not auth.users)
    SELECT id INTO system_user_id FROM public.users LIMIT 1;
    
    -- If no users exist, we can't create conversations yet
    -- This will be retried when a user exists
    IF system_user_id IS NULL THEN
        RAISE EXCEPTION 'Cannot create sport group conversation: No users exist in the system yet. Please create a user first.';
    END IF;

    -- Generate conversation name
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for automatic conversation creation
DROP TRIGGER IF EXISTS sport_group_conversation_trigger ON public.sport_chat_groups;
CREATE TRIGGER sport_group_conversation_trigger
    BEFORE INSERT ON public.sport_chat_groups
    FOR EACH ROW
    WHEN (NEW.conversation_id IS NULL)
    EXECUTE FUNCTION create_sport_group_conversation();

-- 7. Create function to update member count
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

-- 8. Create trigger to update member count when participants join/leave
DROP TRIGGER IF EXISTS sport_group_member_count_trigger ON public.conversation_participants;
CREATE TRIGGER sport_group_member_count_trigger
    AFTER INSERT OR DELETE ON public.conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_sport_group_member_count();

-- 9. Insert default global sport groups
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

-- 10. Function to get or create city sport group
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

-- 11. Function to join sport group
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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View all sport groups
-- SELECT * FROM public.sport_chat_groups ORDER BY city NULLS FIRST, sport;

-- View global groups
-- SELECT * FROM public.sport_chat_groups WHERE city IS NULL ORDER BY sport;

-- View city groups (example: Hyderabad)
-- SELECT * FROM public.sport_chat_groups WHERE city = 'Hyderabad' ORDER BY sport;

-- Test joining a group
-- SELECT join_sport_group(
--     (SELECT id FROM auth.users LIMIT 1), -- user_id
--     'Football', -- sport
--     NULL -- city (NULL for global)
-- );
