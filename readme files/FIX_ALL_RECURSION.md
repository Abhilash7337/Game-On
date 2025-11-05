# 🚨 Fix Conversations Infinite Recursion

## The New Problem
Now the `conversations` table has infinite recursion because its RLS policy references `conversation_participants`, which references `conversations` back → **Circular dependency!**

## 🔧 Complete Fix - Run in Supabase SQL Editor

```sql
-- ========================================
-- FIX ALL INFINITE RECURSION ISSUES
-- ========================================

-- Step 1: Drop ALL problematic policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversation participants for their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;

-- Step 2: Create SIMPLE policies without circular references

-- Conversations: Allow users to see conversations they created OR are directly referenced
CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (
        created_by = auth.uid()
    );

-- Conversation participants: Allow users to see their own participation records
CREATE POLICY "Users can view their participation" ON public.conversation_participants
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Messages: Allow users to see messages they sent OR in conversations they created
CREATE POLICY "Users can view accessible messages" ON public.messages
    FOR SELECT USING (
        sender_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND created_by = auth.uid()
        )
    );

-- Step 3: Add INSERT policies (these are safe)
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Conversation creators can add participants" ON public.conversation_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
    );
```

## ✅ Why This Works

**New Approach:**
- **No circular references** - policies don't reference each other
- **Simple ownership checks** - based on `created_by` and `user_id`
- **Safe for basic chat functionality**

**What each policy does:**
1. **Conversations**: You can see conversations you created
2. **Participants**: You can see your own participation records  
3. **Messages**: You can see messages you sent OR in conversations you created
4. **Inserts**: You can create conversations/messages/add participants

## 🚀 Test After Running

1. Run the SQL above
2. Try sending a message in your app
3. Should work without any infinite recursion!

## 🎯 Alternative: Disable RLS Temporarily

If you're still getting issues, you can temporarily disable RLS for development:

```sql
-- TEMPORARY: Disable RLS for testing (NOT for production!)
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
```

**Use this only for development/testing. Re-enable RLS before going to production!**