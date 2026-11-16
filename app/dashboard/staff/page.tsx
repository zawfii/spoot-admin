import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { PageHeader } from '@/components/ui/PageHeader';
import StaffForm from './StaffForm';
import StaffActions from './StaffActions';

type Member = { user_id: string; email: string; name: string; created_at: string; revoked_at: string | null };

export default async function StaffPage() {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from('staff')
    .select('user_id, email, name, created_at, revoked_at')
    .order('created_at', { ascending: false });
  if (error) console.error('staff:', error.message);
  const rows = (data ?? []) as Member[];

  return (
    <div>
      <PageHeader
        title="Pracownicy"
        subtitle="Dodana osoba dostaje maila z linkiem do ustawienia hasła i może wprowadzać zmiany w panelu. Nie widzi tej strony ani historii zmian."
      />
      <StaffForm />
      <div className="bg-surfaceLowest rounded-2xl border overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Osoba</th>
              <th className="text-left px-4 py-3 font-medium">E-mail</th>
              <th className="text-left px-4 py-3 font-medium">Dodano</th>
              <th className="text-left px-4 py-3 font-medium">Dostęp</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.user_id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/dashboard/history?actor=${m.user_id}`} className="underline underline-offset-2">{m.name}</Link>
                </td>
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString('pl-PL')}</td>
                <td className="px-4 py-3">
                  {m.revoked_at
                    ? <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">Odebrany</span>
                    : <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">Aktywny</span>}
                </td>
                <td className="px-4 py-3"><StaffActions userId={m.user_id} email={m.email} name={m.name} active={!m.revoked_at} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nie ma jeszcze pracowników</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
