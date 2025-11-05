# 🚨 URGENT: Fix Infinite Recursion Error

## The Problem
You're getting `infinite recursion detected in policy` because the RLS policies are referencing themselves in a circular way.

## 🔧 Quick Fix - Run This in Supabase SQL Editor

```sql
-- ========================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ========================================

-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view conversation participants for their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

-- Step 2: Create fixed policies (no circular references)

-- Fixed conversation_participants policy
CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND created_by = auth.uid()
        )
    );

-- Fixed messages policy  
CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT USING (
        sender_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );
```

## ✅ What This Fixes

**Before (Broken):**
- Policy looked at `conversation_participants` table to check `conversation_participants` table → **Infinite loop!**

**After (Fixed):**
- Policy checks user ownership directly
- No circular references
- Messages work properly

## 🚀 Test After Running

1. Run the SQL above in Supabase SQL Editor
2. Try sending a message in your app
3. Should work without infinite recursion error!

---

## 🎯 Root Cause

The original policy was doing this:
```sql
-- BAD: This creates infinite recursion
SELECT 1 FROM conversation_participants cp 
WHERE cp.conversation_id = conversation_participants.conversation_id  -- 🔄 CIRCULAR!
```

The fix removes the circular reference:
```sql
-- GOOD: Direct ownership check, no recursion  
user_id = auth.uid() OR EXISTS(SELECT 1 FROM conversations WHERE...)
```

Run the fix above and your chat should work! 🎉