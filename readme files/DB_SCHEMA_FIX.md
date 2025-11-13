# Database Schema Fix

## Issue: Using Wrong Table Names

### ❌ OLD (Incorrect):
```typescript
chatrooms → conversations
chatroom_members → conversation_participants
```

### ✅ NEW (Correct):
```typescript
conversations (name, type, booking_id, created_by, created_at, updated_at)
conversation_participants (conversation_id, user_id, joined_at, is_active)
```

## Fixed Code

Updated `joinOpenGame()` to:
1. Query `conversations` table instead of `chatrooms`
2. Insert into `conversation_participants` instead of `chatroom_members`
3. Add host to conversation when creating it
4. Set `is_active: true` for participants

## Check Constraint on booking_participants.status

Run this SQL in Supabase to see what values are allowed:

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM 
    pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE 
    t.relname = 'booking_participants'
    AND contype = 'c';
```

## If Status Constraint Fails

If you still get the constraint error, run this to see allowed values:

```sql
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'booking_participants'
    AND column_name = 'status';
```

## Possible Status Values

Based on the bookings table pattern, likely values are:
- `'pending'` - Invitation sent but not accepted
- `'confirmed'` - User has joined the game
- `'cancelled'` - User left or was removed
- `'rejected'` - Declined invitation

## If Constraint Still Fails

**Option 1: Drop the constraint**
```sql
ALTER TABLE public.booking_participants 
DROP CONSTRAINT IF EXISTS booking_participants_status_check;
```

**Option 2: Add correct constraint**
```sql
ALTER TABLE public.booking_participants 
DROP CONSTRAINT IF EXISTS booking_participants_status_check;

ALTER TABLE public.booking_participants 
ADD CONSTRAINT booking_participants_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected'));
```

## Testing

After the fix, test:
1. Join a game - should work without constraint error
2. Check conversations table - should see new row with booking_id
3. Check conversation_participants - should see host + joining user
4. Verify in app that chat is accessible

## Logs to Watch

```
✅ [STORAGE] User joined game! Spots remaining: 1
💬 [STORAGE] Adding user to game conversation...
📝 [STORAGE] Creating new conversation for booking [id]...
✅ [STORAGE] Created conversation: [conversation_id]
✅ [STORAGE] Host added to conversation
✅ [STORAGE] User added to conversation: [conversation_id]
```
