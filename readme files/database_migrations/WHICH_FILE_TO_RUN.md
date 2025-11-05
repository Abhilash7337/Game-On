# How to Run the Sport Chat Migration

You have **3 options** depending on your situation:

## Option 1: You Already Have a User Account ✅ (RECOMMENDED)

If you've already signed up in your app and created at least one user account:

1. **Check first:**
   ```sql
   SELECT COUNT(*) FROM public.users;
   ```
   If this returns 1 or more, proceed to step 2.

2. **Run this file:**
   ```
   002_global_sport_chats.sql
   ```

3. **Then run:**
   ```
   003_message_limits.sql
   ```

## Option 2: No Users Yet, Can't Create One 🔧

If you can't create a user account right now:

1. **Run this file instead:**
   ```
   002_global_sport_chats_NO_USER_REQUIRED.sql
   ```
   This makes `created_by` nullable for system conversations.

2. **Then run:**
   ```
   003_message_limits.sql
   ```

## Option 3: Want to Be Extra Safe 🛡️

Run the pre-check first:

1. **Check if you have users:**
   ```
   000_pre_migration_check.sql
   ```
   This will tell you if you're ready.

2. **If check passes, run:**
   ```
   002_global_sport_chats.sql
   003_message_limits.sql
   ```

3. **If check fails:**
   - Create a user account in your app first
   - OR use Option 2 above

---

## What Each File Does

| File | Purpose | Safe? |
|------|---------|-------|
| `000_pre_migration_check.sql` | Checks if you have users | ✅ Read-only |
| `002_global_sport_chats.sql` | Main migration (requires 1 user) | ✅ Safe |
| `002_global_sport_chats_SAFE.sql` | Same as above with extra checks | ✅ Safe |
| `002_global_sport_chats_NO_USER_REQUIRED.sql` | Works without users | ✅ Safe |
| `003_message_limits.sql` | Prevents database bloat | ✅ Safe |

---

## Quick Decision Tree

```
Do you have at least 1 user account in public.users?
│
├─ YES ──> Use: 002_global_sport_chats.sql
│
└─ NO ──> Can you create a user account now?
    │
    ├─ YES ──> Create account, then use: 002_global_sport_chats.sql
    │
    └─ NO ──> Use: 002_global_sport_chats_NO_USER_REQUIRED.sql
```

---

## Recommended Approach (Easiest)

**Just use the NO_USER_REQUIRED version:**
```sql
-- Step 1
Run: 002_global_sport_chats_NO_USER_REQUIRED.sql

-- Step 2
Run: 003_message_limits.sql
```

This works in all situations and is completely safe! 🎯

---

## After Running Successfully

You should see:
```
✅ MIGRATION COMPLETED SUCCESSFULLY!
Total sport groups: 7
Global sport groups: 7
Conversations created: 7
```

Then your app will show:
- 7 global sport groups in the Global Communities section
- City-specific groups will be created automatically when needed
