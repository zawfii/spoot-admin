'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function assertAdminRole(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Unauthorized';
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'editor'].includes(profile?.role ?? '')) return 'Forbidden';
  return null;
}

export async function approveDeal(dealId: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };

  const supabase = createClient();
  const { error } = await supabase
    .from('deals')
    .update({ status: 'approved' })
    .eq('id', dealId)
    .eq('status', 'pending');
  if (error) return { error: error.message };

  revalidatePath('/dashboard/deals');
  return {};
}

export async function rejectDeal(dealId: string, adminNote: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };

  const supabase = createClient();
  const { error } = await supabase
    .from('deals')
    .update({ status: 'rejected', admin_note: adminNote || null })
    .eq('id', dealId)
    .eq('status', 'pending');
  if (error) return { error: error.message };

  revalidatePath('/dashboard/deals');
  return {};
}
