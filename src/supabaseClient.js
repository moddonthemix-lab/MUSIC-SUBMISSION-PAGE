import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://javnbkmngdkcscsdqttk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphdm5ia21uZ2RrY3Njc2RxdHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjcwMTQsImV4cCI6MjA4NDUwMzAxNH0.2MIMHjVeg3bBxAS_ZaNkpzM1Xt2qUvDsEY_JDotgyF8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
