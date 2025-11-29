import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dtubsaxnyimwpsutyncg.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dWJzYXhueWltd3BzdXR5bmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwOTY0MjksImV4cCI6MjA3ODY3MjQyOX0.R8upvspPYqH1WYH5gwElRQ9UmXBwkVh53lv1hTNRUfY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);