import { supabase } from '../integrations/supabase/client';
import { AuthError } from '@supabase/supabase-js';

/**
 * Interface for authentication response
 */
interface AuthResponse {
  success: boolean;
  error?: AuthError | null;
}

/**
 * Signs in a user with email and password
 * @param email User's email
 * @param password User's password
 * @throws Error if authentication fails
 */
export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    throw error;
  }
}

/**
 * Signs up a new user with email and password
 * @param email User's email
 * @param password User's password
 * @throws Error if sign up fails
 */
export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  
  if (error) {
    throw error;
  }
}

/**
 * Signs out the current user
 * @returns Promise with auth response
 */
export async function signOut(): Promise<AuthResponse> {
  const { error } = await supabase.auth.signOut();
  
  return {
    success: !error,
    error
  };
}