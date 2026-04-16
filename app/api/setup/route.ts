import { NextResponse } from 'next/server';
import { saveConfig } from '@/utils/config';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseKey, adminUsername, adminPassword } = await request.json();

    if (!supabaseUrl || !supabaseKey || !adminUsername || !adminPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Save configuration out of bound bypassing Next.js env restrictions using APPDATA / HOME
    saveConfig({
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey
    });

    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Create an Admin account directly in Supabase Auth using a dummy email (skip real email setup)
      const fakeEmail = `${adminUsername}@aura.local`;
      const { error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: adminPassword,
      });

      if (authError && !authError.message.includes('already registered')) {
        console.warn('Supabase Auth error (might be expected if already setup):', authError.message);
      }

      const { error: tableCheck } = await supabase.from('profile_data').select('id').limit(1);

      if (tableCheck && tableCheck.code === 'PGRST116') {
        const { error: rpcError } = await supabase.rpc('setup_profile_table');
        if (rpcError) {
          console.warn('Could not auto-create tables via RPC', rpcError);
          const sql = `
-- 1. Create the profile_data table
CREATE TABLE IF NOT EXISTS profile_data (
  id text PRIMARY KEY,
  content jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE profile_data ENABLE ROW LEVEL SECURITY;

-- 3. Safely recreate policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON profile_data;
    DROP POLICY IF EXISTS "Allow public write access" ON profile_data;
END $$;

CREATE POLICY "Allow public read access"
ON profile_data FOR SELECT
USING (true);

CREATE POLICY "Allow public write access"
ON profile_data FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Force schema cache refresh (Fixes "schema cache is stale" error)
NOTIFY pgrst, 'reload schema';
          `.trim();
          return NextResponse.json({
            success: false,
            sqlRequired: true,
            sql,
            message: 'Account connected successfully, but the data table is missing. Please run the SQL code below in the Supabase "SQL Editor" to create the table.'
          });
        }
      }

    } catch (supaEx: any) {
      console.error('Supabase Setup Step Error:', supaEx.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Setup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
