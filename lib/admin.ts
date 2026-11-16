import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Strony tylko dla admina (Pracownicy, Historia). Editor ląduje na pulpicie;
// danych i tak nie zobaczy — RLS na staff i admin_audit_log wpuszcza tylko admina.
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');
  return supabase;
}
