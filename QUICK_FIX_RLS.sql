-- ========================================
-- QUICK FIX: DISABLE RLS TO RESTORE LOGIN
-- ========================================

-- Disable RLS on all tables immediately
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Test query to verify access works
SELECT 'RLS_DISABLED' as status, COUNT(*) as profile_count FROM profiles;
