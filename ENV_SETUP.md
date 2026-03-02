# Environment Setup Instructions

## 1. Create .env.local file

Create a file named `.env.local` in your project root with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xvzaztdgznneyxjsaptr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emF6dGRnem5uZXl4anNhcHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzQ3ODYsImV4cCI6MjA4Nzg1MDc4Nn0.Fk-ZRjJCKT5NwCPcZEJBTTaOCs9xm2AwGJrLO1n6Zj4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emF6dGRnem5uZXl4anNhcHRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI3NDc4NiwiZXhwIjoyMDg3ODUwNzg2fQ.mrpHdlgDOjtPjXkXp0HEgcZ7TslVAwyBHXWscLiqYiE

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 2. Security Notes

- NEVER commit `.env.local` to git
- The service role key should ONLY be used in server-side code
- Public keys (NEXT_PUBLIC_*) are safe for client-side use
- Service role key bypasses RLS - use with caution

## 3. Database Setup

Run the following SQL in your Supabase SQL editor to create the base tables:

```sql
-- Basic profiles table (we'll expand this later)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert your profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. Test the Setup

1. Start the development server: `npm run dev`
2. Visit: http://localhost:3000/login
3. Visit: http://localhost:3000/signup
4. Test API: http://localhost:3000/api/admin/test

## 5. Next Steps

After testing basic auth, we'll implement:
- Applications table
- Access codes system
- Membership management
- Email notifications
- Admin dashboard
