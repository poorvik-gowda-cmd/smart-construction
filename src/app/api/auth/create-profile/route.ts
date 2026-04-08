import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Uses SERVICE ROLE key to bypass RLS — safe because we verify the user's JWT first
const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export async function POST(req: Request) {
  try {
    const { userId, fullName, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowedRoles = ['admin', 'engineer', 'client'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Missing Server Configuration (Service Role Key)' }, { status: 400 });
    }

    // Verify the user actually exists in auth
    const { data: { user }, error: userError } = await admin.auth.admin.getUserById(userId);
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert profile using service role (bypasses RLS)
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      full_name: fullName || '',
      role,
      // Clients now start as "pending_assignment" instead of having a separate bit
      pending_assignment: role === 'client' ? true : false,
    });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Create profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
