# 🚀 Minimal Supabase Setup - Just What You Need for Chat to Work

## What You ACTUALLY Need (Essential Only)

You have users/clients/venues/bookings already. For chat to work, you only need these **4 tables**:

---

## 📋 STEP 1: Essential Tables Only

```sql
-- ========================================
-- MINIMAL CHAT TABLES (REQUIRED)
-- ========================================

-- 1. Friends table - for adding friends
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE(user_id, friend_id)
);

-- 2. Conversations table - for chat rooms
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('direct', 'group', 'game')) DEFAULT 'direct',
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 3. Conversation participants - who's in each chat
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE(conversation_id, user_id)
);

-- 4. Messages table - the actual messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);
```

---

## 📋 STEP 2: Basic Security (Required for App to Work)

```sql
-- ========================================
-- MINIMAL SECURITY (REQUIRED)
-- ========================================

-- Enable RLS (Required or app won't work)
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Basic policies (Required)
CREATE POLICY "Users can view their friends" ON public.friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can add friends" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friends" ON public.friends
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = conversations.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add participants" ON public.conversation_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
        )
    );
```

---

## 📋 STEP 3: Enable Real-time (Required for Live Chat)

```sql
-- ========================================
-- REAL-TIME (REQUIRED FOR LIVE CHAT)
-- ========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
```

---

## 📋 STEP 4: Add Index for Performance (Recommended)

```sql
-- ========================================
-- BASIC INDEXES (RECOMMENDED)
-- ========================================

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
```

---

## ❌ What You DON'T Need (For Now)

**Skip these for now - they're nice-to-have:**

1. ❌ `user_presence` table - online status (fancy feature)
2. ❌ Complex metadata/JSONB - just basic text messages
3. ❌ `updated_at` columns - not needed for basic chat
4. ❌ Triggers for timestamps - can add later
5. ❌ Advanced indexes - only add if you have performance issues
6. ❌ Test data - you can add real data through the app

---

## 🎯 Why This Minimal Setup?

**Essential (Must Have):**
- `friends` table → So users can add friends
- `conversations` table → Creates chat rooms
- `conversation_participants` → Knows who's in each chat
- `messages` table → Stores actual messages
- RLS policies → Security (app won't work without these)
- Real-time → Makes messages appear instantly

**Optional (Nice to Have Later):**
- Online presence → See who's online
- Message read status → See if message was read
- Complex metadata → Rich messages with images/locations
- Advanced indexes → Only needed with thousands of users

---

## 🚀 This Minimal Setup Gives You:

✅ **Add friends by searching**  
✅ **Send/receive messages in real-time**  
✅ **Message history**  
✅ **Secure access (users only see their own chats)**  
✅ **Direct messages between friends**  

---

## 🔧 Environment Variables (Still Need These)

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_SCHEME=gameon
```

---

**Result: Your chat will work with just these 4 tables + basic security!** 🎉

You can always add the fancy features (online status, read receipts, etc.) later once basic chat is working.