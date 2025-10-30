import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  username: string | null;
  unit_preference: string | null; // e.g., 'lbs' | 'kg'
  created_at?: string | null;
  updated_at?: string | null;
}

export async function getMyProfile() : Promise<Profile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function upsertMyProfile(update: Pick<Profile, 'username' | 'unit_preference'>): Promise<Profile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // ensure row exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (!existing) {
    await supabase.from('profiles').insert({ id: userId });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}


