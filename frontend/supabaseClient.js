import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://stihpbzqlvubbtmwyfie.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWhwYnpxbHZ1YmJ0bXd5ZmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1Mzg3NjUsImV4cCI6MjEwNzExNDc2NX0.XJeNTuP7iKzCmGUy8HAVhXcg2K4d-L-hj4ZXxC2enEw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);