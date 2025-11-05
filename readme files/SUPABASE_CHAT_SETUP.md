# 🔧 Complete Supabase Setup Guide for GameOn Chat Functionality

## What You Need to Add

You currently have the basic tables for users, clients, venues, and bookings, but you're missing all the **chat functionality tables** that we implemented. Here's what you need to add to your Supabase SQL editor:

---

## 📋 Step 1: Add Missing Chat Tables

Copy and paste these SQL commands in your Supabase SQL Editor:

```sql
-- ========================================
-- CHAT FUNCTIONALITY TABLES
-- ========================================

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
    game_id UUID, -- Reference to game/booking if it's a game chat
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
    metadata JSONB, -- For storing additional data like scores, image URLs, etc.
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
```

---

## 📋 Step 2: Add Chat-Related Indexes

```sql
-- ========================================
-- ADDITIONAL INDEXES FOR CHAT PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_full_name ON public.users(full_name);
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
```

---

## 📋 Step 3: Enable Row Level Security on Chat Tables

```sql
-- ========================================
-- ENABLE RLS ON CHAT TABLES
-- ========================================

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Step 4: Add RLS Policies for Chat Functionality

```sql
-- ========================================
-- RLS POLICIES FOR CHAT TABLES
-- ========================================

-- RLS Policies for friends table
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

-- RLS Policies for conversations
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

-- RLS Policies for conversation participants
CREATE POLICY "Users can view conversation participants for their conversations" ON public.conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND created_by = auth.uid()
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

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        sender_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for user presence
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
```

---

## 📋 Step 5: Add Triggers for Chat Tables

```sql
-- ========================================
-- TRIGGERS FOR CHAT TABLES
-- ========================================

-- Create triggers for updated_at columns on chat tables
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON public.friends 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages 
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

-- Create trigger for new users to automatically create presence
CREATE TRIGGER create_user_presence_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE PROCEDURE create_user_presence();
```

---

## 📋 Step 6: Enable Real-time on Message Tables

In your Supabase dashboard:

1. Go to **Database** → **Replication**
2. Enable real-time for these tables:
   - `public.messages`
   - `public.conversations`
   - `public.friends`
   - `public.user_presence`

**OR** run this SQL:

```sql
-- ========================================
-- ENABLE REAL-TIME SUBSCRIPTIONS
-- ========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
```

---

## 📋 Step 7: Add Some Test Data (Optional)

```sql
-- ========================================
-- TEST DATA FOR DEVELOPMENT
-- ========================================

-- Add some test users for chat testing
INSERT INTO public.users (id, email, full_name, phone) VALUES 
('73235bbe-e8ff-4a9a-9757-df29e85133a8', 'testuser1@gameon.com', 'Alice Johnson', '+1-555-0101'),
('84346ccf-f9aa-5b8b-a868-ef30f96244b9', 'testuser2@gameon.com', 'Bob Smith', '+1-555-0102'),
('95457dda-0abb-6c9c-b979-f041a07355ca', 'testuser3@gameon.com', 'Charlie Brown', '+1-555-0103')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- This will automatically create user presence records due to the trigger
```

---

## 🔧 Step 8: Environment Variables

Make sure you have these in your `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_SCHEME=gameon
```

---

## ✅ What This Enables

After running all these commands, your app will have:

1. **Friend System**: Users can search for and add friends
2. **Real-time Messaging**: Direct messages between friends
3. **Group Chats**: For game discussions
4. **Online Presence**: See who's online
5. **Message History**: All messages are stored and retrievable
6. **Secure Access**: Row Level Security protects all data

---

## 🚀 Testing the Setup

1. Run the SQL commands above in your Supabase SQL editor
2. Make sure all commands execute without errors
3. Verify the tables exist in your **Table Editor**
4. Check that **Replication** is enabled for the message tables
5. Your app should now work with real chat functionality!

---

## 🔍 Troubleshooting

If you get errors:
- Make sure you run the commands in the exact order shown
- Check that your existing user/client data doesn't conflict
- Verify that RLS is properly configured
- Ensure real-time subscriptions are enabled

The network errors you see in the app will disappear once this database setup is complete!