-- Check all venues and their courts
-- Run this in Supabase SQL Editor to see which venues have courts

-- 1. List all active venues
SELECT 
    id,
    name,
    is_active,
    created_at
FROM venues
WHERE is_active = true
ORDER BY created_at DESC;

-- 2. List all courts for active venues
SELECT 
    c.id as court_id,
    c.venue_id,
    v.name as venue_name,
    c.name as court_name,
    c.type as sport_type,
    c.is_active
FROM courts c
JOIN venues v ON c.venue_id = v.id
WHERE v.is_active = true
ORDER BY v.name, c.name;

-- 3. Show venues WITHOUT any courts
SELECT 
    v.id,
    v.name,
    v.is_active,
    COUNT(c.id) as court_count
FROM venues v
LEFT JOIN courts c ON v.id = c.venue_id AND c.is_active = true
WHERE v.is_active = true
GROUP BY v.id, v.name, v.is_active
HAVING COUNT(c.id) = 0;

-- ========================================
-- 4. ADD RANDOM COURTS TO ALL VENUES WITHOUT COURTS
-- ========================================
-- This will add 2-4 random courts to each venue that has no courts
-- Run this AFTER checking step 3 to add courts to venues

DO $$
DECLARE
    venue_record RECORD;
    court_types TEXT[] := ARRAY['basketball', 'tennis', 'badminton', 'football', 'cricket', 'volleyball'];
    num_courts INT;
    court_type TEXT;
    i INT;
BEGIN
    -- Loop through all venues without courts
    FOR venue_record IN 
        SELECT v.id, v.name
        FROM venues v
        LEFT JOIN courts c ON v.id = c.venue_id AND c.is_active = true
        WHERE v.is_active = true
        GROUP BY v.id, v.name
        HAVING COUNT(c.id) = 0
    LOOP
        -- Generate random number of courts (2 to 4)
        num_courts := floor(random() * 3 + 2)::INT;
        
        RAISE NOTICE 'Adding % courts to venue: %', num_courts, venue_record.name;
        
        -- Add courts with random sport types
        FOR i IN 1..num_courts LOOP
            -- Pick random sport type
            court_type := court_types[floor(random() * array_length(court_types, 1) + 1)::INT];
            
            INSERT INTO courts (venue_id, name, type, is_active)
            VALUES (
                venue_record.id,
                'Court ' || i,
                court_type,
                true
            );
            
            RAISE NOTICE '  - Added Court %: %', i, court_type;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Finished adding courts to all venues!';
END $$;

-- ========================================
-- 5. ALTERNATIVE: Add specific courts to specific venue (Manual)
-- ========================================
-- Replace <venue_id> with actual venue ID from step 1
-- Uncomment and run this for manual control:

/*
INSERT INTO courts (venue_id, name, type, is_active)
VALUES 
    ('<venue_id>', 'Court 1', 'basketball', true),
    ('<venue_id>', 'Court 2', 'tennis', true),
    ('<venue_id>', 'Court 3', 'badminton', true);
*/

-- ========================================
-- 6. VERIFY: Check courts were added successfully
-- ========================================
SELECT 
    v.name as venue_name,
    COUNT(c.id) as court_count,
    STRING_AGG(DISTINCT c.type, ', ') as sports_available
FROM venues v
LEFT JOIN courts c ON v.id = c.venue_id AND c.is_active = true
WHERE v.is_active = true
GROUP BY v.id, v.name
ORDER BY court_count DESC, v.name;

