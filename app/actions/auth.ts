'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(email: string, password: string): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return error.message === 'Invalid login credentials'
      ? 'Nieprawidłowy email lub hasło.'
      : error.message;
  }
  redirect('/dashboard');
}
