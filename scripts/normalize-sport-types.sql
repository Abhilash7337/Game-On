-- ========================================
-- NORMALIZE SPORT TYPES TO LOWERCASE
-- ========================================
-- This ensures all sport types are lowercase for consistent filtering
-- Run this in Supabase SQL Editor

UPDATE courts
SET type = LOWER(type)
WHERE type IS NOT NULL;

-- ========================================
-- VERIFY: Check all sport types are now lowercase
-- ========================================
SELECT 
    c.id as court_id,
    v.name as venue_name,
    c.name as court_name,
    c.type as sport_type,
    c.is_active
FROM courts c
JOIN venues v ON c.venue_id = v.id
WHERE v.is_active = true AND c.is_active = true
ORDER BY v.name, c.name;

-- ========================================
-- CHECK: Sport types distribution
-- ========================================
SELECT 
    type as sport_type,
    COUNT(*) as court_count,
    COUNT(DISTINCT venue_id) as venue_count
FROM courts
WHERE is_active = true
GROUP BY type
ORDER BY court_count DESC;
