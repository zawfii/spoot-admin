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

const PACKAGE_DAYS: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30 };

export async function approvePromotion(promotionId: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };

  const supabase = createClient();

  const { data: promo, error: fetchErr } = await supabase
    .from('promotions')
    .select('package')
    .eq('id', promotionId)
    .single();
  if (fetchErr || !promo) return { error: fetchErr?.message ?? 'Not found' };

  const days = PACKAGE_DAYS[promo.package] ?? 7;
  const active_from = new Date().toISOString();
  const active_until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('promotions')
    .update({ status: 'approved', active_from, active_until })
    .eq('id', promotionId)
    .eq('status', 'pending');
  if (error) return { error: error.message };

  revalidatePath('/dashboard/promotions');
  return {};
}

export async function rejectPromotion(promotionId: string, adminNote: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };

  const supabase = createClient();
  const { error } = await supabase
    .from('promotions')
    .update({ status: 'rejected', admin_note: adminNote || null })
    .eq('id', promotionId)
    .eq('status', 'pending');
  if (error) return { error: error.message };

  revalidatePath('/dashboard/promotions');
  return {};
}
