import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing or invalid in environment variables.');
  } else {
    console.log('Supabase Client initialized for:', supabaseUrl);
  }

  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
  )
}
