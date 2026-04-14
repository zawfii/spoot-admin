'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveOwnershipRequest(requestId: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('approve_ownership_request', { request_id: requestId });
  if (error) return { error: error.message };
  revalidatePath('/dashboard/ownership-requests');
  return {};
}

export async function rejectOwnershipRequest(requestId: string, adminNote: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('ownership_requests')
    .update({ status: 'rejected', admin_note: adminNote || null })
    .eq('id', requestId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/ownership-requests');
  return {};
}
