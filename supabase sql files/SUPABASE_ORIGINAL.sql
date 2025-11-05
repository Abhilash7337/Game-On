-- ============================================
-- SUPABASE DATABASE SCHEMA FOR GAME-ON APP
-- ============================================
-- Complete SQL commands to create all tables, policies, and functions
-- Copy and paste this entire file into Supabase SQL Editor and run it
-- ============================================

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================

-- Create users table for regular users (players)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create clients table for business owners (venue owners)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create venues table (for clients to add their sports venues)
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    location JSONB NOT NULL DEFAULT '{"latitude": 0, "longitude": 0}'::jsonb,
    description TEXT,
    facilities TEXT[],
    images TEXT[],
    pricing JSONB,
    availability JSONB,
    courts JSONB DEFAULT '[]'::jsonb,
    rating DECIMAL(2,1) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create bookings table (for users to book venues)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    total_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create friends table for friend relationships
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE(user_id, friend_id)
);

-- Create conversations table for chat threads
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('direct', 'group', 'game')) DEFAULT 'direct',
    name TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    game_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create conversation participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (id),
    UNIQUE(conversation_id, user_id)
);

-- Create messages table for all chat messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'image', 'system', 'score')) DEFAULT 'text',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create user presence table for online status
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- ============================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON public.users(full_name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_venues_client_id ON public.venues(client_id);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON public.venues(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON public.bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON public.user_presence(is_online);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================

-- Users table policies
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients table policies
CREATE POLICY "Clients can read own data" ON public.clients
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Clients can update own data" ON public.clients
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Clients can insert own data" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Venues table policies
CREATE POLICY "Anyone can read active venues" ON public.venues
    FOR SELECT USING (true);

CREATE POLICY "Clients can insert own venues" ON public.venues
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own venues" ON public.venues
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete own venues" ON public.venues
    FOR DELETE USING (auth.uid() = client_id);

-- Bookings table policies
CREATE POLICY "Users can read own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can read bookings for their venues" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.venues 
            WHERE venues.id = bookings.venue_id 
            AND venues.client_id = auth.uid()
        )
    );

CREATE POLICY "Venue owners can update bookings for their venues" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.venues 
            WHERE venues.id = bookings.venue_id 
            AND venues.client_id = auth.uid()
        )
    );

-- Friends table policies
CREATE POLICY "Users can view their own friend requests and accepted friends" ON public.friends
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = friend_id OR 
        (auth.uid() = user_id AND status = 'accepted') OR
        (auth.uid() = friend_id AND status = 'accepted')
    );

CREATE POLICY "Users can create friend requests" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friend requests" ON public.friends
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.uid() = friend_id
    );

-- Conversations table policies
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = conversations.id 
            AND user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversation participants table policies
CREATE POLICY "Users can view conversation participants for their conversations" ON public.conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversation_participants.conversation_id 
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    );

CREATE POLICY "Users can add participants to conversations they created" ON public.conversation_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND created_by = auth.uid()
        )
    );

-- Messages table policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
            AND is_active = true
        )
    );

-- User presence table policies
CREATE POLICY "Users can view presence of their friends" ON public.user_presence
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.friends 
            WHERE (user_id = auth.uid() AND friend_id = user_presence.user_id AND status = 'accepted')
            OR (friend_id = auth.uid() AND user_id = user_presence.user_id AND status = 'accepted')
        )
    );

CREATE POLICY "Users can update their own presence" ON public.user_presence
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- STEP 5: CREATE FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at 
    BEFORE UPDATE ON public.venues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at 
    BEFORE UPDATE ON public.friends 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user presence record
CREATE OR REPLACE FUNCTION create_user_presence()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_presence (user_id, is_online, last_seen)
    VALUES (NEW.id, false, NOW())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for new users to auto-create presence record
CREATE TRIGGER create_user_presence_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_user_presence();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything was created successfully:

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check venues table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'venues';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ============================================
-- NOTES
-- ============================================
-- 1. All tables use UUID for primary keys
-- 2. Row Level Security (RLS) is enabled on all tables
-- 3. Venues table has location field (JSONB) for GPS coordinates
-- 4. Anyone can read venues (public access for players)
-- 5. Only venue owners can modify their own venues
-- 6. Automatic timestamp updates via triggers
-- 7. User presence auto-created when new user signs up
