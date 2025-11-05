-- ============================================
-- PRE-MIGRATION CHECK
-- Run this BEFORE running 002_global_sport_chats.sql
-- ============================================

DO $$
DECLARE
    user_count integer;
    auth_user_count integer;
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        RAISE EXCEPTION 'ERROR: users table does not exist!';
    END IF;
    
    -- Count users in public.users
    SELECT COUNT(*) INTO user_count FROM public.users;
    
    -- Count users in auth.users
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRE-MIGRATION CHECK RESULTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users in auth.users: %', auth_user_count;
    RAISE NOTICE 'Users in public.users: %', user_count;
    RAISE NOTICE '========================================';
    
    IF user_count = 0 THEN
        RAISE EXCEPTION 'ERROR: No users found in public.users table! 
        
SOLUTION: You need to create at least one user account first.
        
HOW TO FIX:
1. Go to your app and sign up/create an account
2. OR use Supabase Auth to create a test user
3. Then come back and run the migration again

WHY: The sport group conversations need a "created_by" user ID from the public.users table.';
    ELSE
        RAISE NOTICE '✅ CHECK PASSED: % user(s) found', user_count;
        RAISE NOTICE '✅ You can proceed with the migration!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next step: Run 002_global_sport_chats.sql';
    END IF;
END $$;
