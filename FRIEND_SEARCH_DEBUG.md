# 🔍 Friend Search Debug Guide

## How Friend Search Currently Works

1. **Search Function:** `FriendService.searchUsers(query)`
2. **Database Query:** Searches `users` table where `full_name` contains your text
3. **Minimum Length:** Need at least 2 characters to search
4. **Results:** Shows users you can send friend requests to

---

## 🚨 Common Issues & Solutions

### Issue 1: No Users in Database
**Problem:** Your `users` table is empty or has no `full_name` data

**Check this in Supabase:**
```sql
-- Check if users exist
SELECT id, email, full_name FROM public.users LIMIT 10;
```

**Solution:** Add some test users:
```sql
-- Add test users (run in Supabase SQL Editor)
INSERT INTO public.users (id, email, full_name, phone) VALUES 
(gen_random_uuid(), 'alice@test.com', 'Alice Johnson', '+1234567890'),
(gen_random_uuid(), 'bob@test.com', 'Bob Smith', '+1234567891'),
(gen_random_uuid(), 'charlie@test.com', 'Charlie Brown', '+1234567892');
```

### Issue 2: Wrong Column Name
**Problem:** Your `users` table might use `name` instead of `full_name`

**Check your table structure:**
```sql
-- Check column names in users table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';
```

**If column is named `name` instead of `full_name`, we need to update the service:**

### Issue 3: RLS Blocking Search
**Problem:** Row Level Security preventing user search

**Current policy might be too restrictive. Check with:**
```sql
-- Check current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

**Add a policy to allow user search:**
```sql
-- Allow users to search other users (for friend discovery)
CREATE POLICY "Users can search other users for friends" ON public.users
    FOR SELECT USING (true);
```

### Issue 4: Authentication Issue
**Problem:** User not logged in or auth token invalid

---

## 🛠️ Debug Steps

### Step 1: Check Your Users Table
Go to Supabase Dashboard → Table Editor → `users` table:
- Are there any users?
- What columns exist? (`full_name`, `name`, `email`?)
- Do they have data in the name field?

### Step 2: Test the Query Directly
In Supabase SQL Editor, run:
```sql
-- Test the exact query the app uses
SELECT id, full_name, email 
FROM public.users 
WHERE full_name ILIKE '%alice%'
LIMIT 10;
```

### Step 3: Add Debug Logging
I can update the friend service to show more debug info.

### Step 4: Add Test Data
If no users exist, add some test users first.

---

## 🚀 Quick Fix Options

### Option 1: Add Test Users First
```sql
INSERT INTO public.users (id, email, full_name) VALUES 
(gen_random_uuid(), 'test1@example.com', 'Test User One'),
(gen_random_uuid(), 'test2@example.com', 'Test User Two');
```

### Option 2: Update Search to Use Different Column
If your table uses `name` instead of `full_name`, I'll update the service.

### Option 3: Fix RLS Policy
Add policy to allow user discovery for friends.

---

## 📱 Testing Steps

1. Add test users to database
2. Open app → Social tab
3. Tap the "+" icon (top right)
4. Search for "Test" or "Alice" 
5. Should show results now!

---

## Next Steps
Tell me:
1. Do you have any users in your `users` table?
2. What columns does your `users` table have?
3. Are you logged in to the app when testing?

I'll help fix the specific issue!