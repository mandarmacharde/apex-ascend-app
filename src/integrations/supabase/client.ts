// Inside src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// --- Line 4: FIXED VARIABLES ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
// ---------------------------------

export const supabase = createClient<Database>(
    supabaseUrl, 
    supabaseAnonKey, 
    {
        auth: {
            storage: localStorage,
            persistSession: true,
            autoRefreshToken: true,
        },
    }
);