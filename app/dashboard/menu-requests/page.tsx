import { createClient } from '@/lib/supabase/server';
import DoneButton from './DoneButton';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function MenuRequestsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'pending';
  const supabase = createClient();

  let query = supabase
    .from('menu_entry_requests')
    .select('id, place_id, owner_id, phone, email, status, created_at, places(name)')
    .order('created_at', { ascending: false });
  if (filter === 'pending') query = query.eq('status', 'pending');
  const { data, error } = await query;
  if (error) console.error('menu_entry_requests:', error.message);
  const rows = (data ?? []) as any[];

  const ownerIds = Array.from(new Set(rows.map(r => r.owner_id)));
  const { data: profiles } = ownerIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', ownerIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const names = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-heading text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 font-bold">Prośby o menu</h1>
        <div className="flex gap-2">
          <a href="?filter=pending" className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === 'pending' ? 'bg-primary text-onPrimary border-primary' : 'border-primary/25 hover:bg-surfaceLow'}`}>Do zrobienia</a>
          <a href="?filter=all" className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === 'all' ? 'bg-primary text-onPrimary border-primary' : 'border-primary/25 hover:bg-surfaceLow'}`}>Wszystkie</a>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Właściciel chce, żebyśmy wprowadzili jego kartę. Skontaktuj się, poproś o zdjęcie albo PDF menu, a po dodaniu dań oznacz jako zrobione.</p>

      <div className="bg-surfaceLowest rounded-2xl border overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Lokal</th>
              <th className="text-left px-4 py-3 font-medium">Właściciel</th>
              <th className="text-left px-4 py-3 font-medium">Telefon</th>
              <th className="text-left px-4 py-3 font-medium">E-mail</th>
              <th className="text-left px-4 py-3 font-medium">Kiedy</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <a href={`/dashboard/places/${r.place_id}`} className="underline underline-offset-2">{r.places?.name ?? '—'}</a>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{names[r.owner_id] ?? r.owner_id}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.phone ? <a href={`tel:${r.phone}`} className="underline underline-offset-2">{r.phone}</a> : '—'}</td>
                <td className="px-4 py-3">{r.email ? <a href={`mailto:${r.email}`} className="underline underline-offset-2">{r.email}</a> : '—'}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  {r.status === 'pending'
                    ? <DoneButton id={r.id} />
                    : <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">Zrobione</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{filter === 'pending' ? 'Brak próśb do zrobienia' : 'Brak próśb'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
