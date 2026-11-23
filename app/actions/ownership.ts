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

// Push o decyzji do zgłaszającego (funkcja claim-push). Błąd pusha nie cofa decyzji.
async function notifyClaimant(supabase: ReturnType<typeof createClient>, requestId: string) {
  await supabase.functions.invoke('claim-push', { body: { requestId } }).catch(() => {});
}

export async function approveOwnershipRequest(requestId: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };
  const supabase = createClient();
  const { error } = await supabase.rpc('approve_ownership_request', { request_id: requestId });
  if (error) return { error: error.message };
  await notifyClaimant(supabase, requestId);
  revalidatePath('/dashboard/ownership-requests');
  return {};
}

export async function rejectOwnershipRequest(requestId: string, adminNote: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };
  const supabase = createClient();
  const { error } = await supabase
    .from('ownership_requests')
    .update({ status: 'rejected', admin_note: adminNote || null })
    .eq('id', requestId)
    .eq('status', 'pending');
  if (error) return { error: error.message };
  await notifyClaimant(supabase, requestId);
  revalidatePath('/dashboard/ownership-requests');
  return {};
}
