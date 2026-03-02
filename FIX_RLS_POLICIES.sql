-- ========================================
-- FIX RLS POLICIES - REMOVE INFINITE RECURSION
-- ========================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;

DROP POLICY IF EXISTS "Users can view own access codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can manage access codes" ON access_codes;

DROP POLICY IF EXISTS "Users can view own memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;

DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;

-- ========================================
-- CREATE NEW, NON-RECURSIVE POLICIES
-- ========================================

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- APPLICATIONS POLICIES
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (user_id IN (
    SELECT user_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all applications" ON applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- ACCESS CODES POLICIES
CREATE POLICY "Users can view own access codes" ON access_codes
  FOR SELECT USING (user_id IN (
    SELECT user_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage access codes" ON access_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- MEMBERSHIPS POLICIES
CREATE POLICY "Users can view own memberships" ON memberships
  FOR SELECT USING (user_id IN (
    SELECT user_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all memberships" ON memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- AUDIT LOG POLICIES
CREATE POLICY "Admins can view audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- ========================================
-- CREATE A SIMPLE TEST POLICY FOR PROFILES
-- ========================================

-- For testing, allow all authenticated users to view profiles
CREATE POLICY "Allow authenticated users to view profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- VERIFICATION
-- ========================================

-- Test the policies
SELECT 'profiles_policies' as table_name, COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'profiles';
