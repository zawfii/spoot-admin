'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Uprawnienia sprawdza edge function manage-staff (tylko rola 'admin') —
// to ona ma service role potrzebny do zaproszenia i zmiany profiles.role.
async function manageStaff(body: Record<string, unknown>): Promise<{ error?: string }> {
  const { error } = await createClient().functions.invoke('manage-staff', { body });
  if (error) {
    const res = (error as { context?: Response }).context;
    const detail = res?.json ? (await res.json().catch(() => null))?.error : null;
    return { error: detail ?? error.message };
  }
  revalidatePath('/dashboard/staff');
  return {};
}

export async function addStaff(email: string, name: string) {
  const h = headers();
  const origin = h.get('origin') ?? `https://${h.get('host')}`;
  return manageStaff({ action: 'add', email, name, redirectTo: `${origin}/set-password` });
}

export async function revokeStaff(userId: string) {
  return manageStaff({ action: 'revoke', userId });
}
