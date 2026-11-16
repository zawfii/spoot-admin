'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Prośby z panelu właściciela (panel.spootme.pl): promocje ofert dnia i „wprowadźcie menu za mnie”.

async function assertAdminRole(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Unauthorized';
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'editor'].includes(profile?.role ?? '')) return 'Forbidden';
  return null;
}

const DEAL_PROMO_DAYS: Record<string, number> = { '3d': 3, '7d': 7, '14d': 14 };

export async function approveDealPromotion(id: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };
  const supabase = createClient();

  const { data: promo, error: fetchErr } = await supabase.from('deal_promotions').select('package').eq('id', id).single();
  if (fetchErr || !promo) return { error: fetchErr?.message ?? 'Not found' };

  const days = DEAL_PROMO_DAYS[promo.package] ?? 7;
  const { error } = await supabase
    .from('deal_promotions')
    .update({
      status: 'approved',
      active_from: new Date().toISOString(),
      active_until: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) return { error: error.message };

  revalidatePath('/dashboard/deal-promotions');
  return {};
}

export async function rejectDealPromotion(id: string, adminNote: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };
  const supabase = createClient();
  const { error } = await supabase
    .from('deal_promotions')
    .update({ status: 'rejected', admin_note: adminNote || null })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) return { error: error.message };
  revalidatePath('/dashboard/deal-promotions');
  return {};
}

export async function markMenuRequestDone(id: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };
  const supabase = createClient();
  const { error } = await supabase.from('menu_entry_requests').update({ status: 'done' }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/menu-requests');
  return {};
}

// Strona dla lokalu: pending → approved | rejected, approved → done.
const WEBSITE_FROM: Record<string, string> = { approved: 'pending', rejected: 'pending', done: 'approved' };

export async function setWebsiteRequestStatus(
  id: string,
  status: 'approved' | 'rejected' | 'done',
  adminNote?: string,
): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };
  const from = WEBSITE_FROM[status];
  if (!from) return { error: 'Nieprawidłowy status' };
  const supabase = createClient();
  const patch: { status: string; admin_note?: string | null } = { status };
  if (status === 'rejected') patch.admin_note = adminNote?.slice(0, 500) || null;
  const { data, error } = await supabase
    .from('website_requests')
    .update(patch)
    .eq('id', id)
    .eq('status', from)
    .select('id');
  if (error) return { error: error.message };
  if (!data?.length) return { error: 'Prośba zmieniła się w międzyczasie — odśwież stronę.' };
  revalidatePath('/dashboard/website-requests');
  return {};
}
