import { createClient } from '@/lib/supabase/server';
import RequestButtons from './RequestButtons';

const PACKAGES: Record<string, string> = { '3d': '3 dni · 29 zł', '7d': '7 dni · 59 zł', '14d': '14 dni · 99 zł' };

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusBadge(status: string) {
  if (status === 'pending') return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">Oczekuje</span>;
  if (status === 'approved') return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">Aktywna</span>;
  if (status === 'expired') return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">Wygasła</span>;
  return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">Odrzucona</span>;
}

export default async function DealPromotionsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'pending';
  const supabase = createClient();

  let query = supabase
    .from('deal_promotions')
    .select('id, owner_id, package, status, active_until, admin_note, created_at, places(name), deals(dish_name, price)')
    .order('created_at', { ascending: false });
  if (filter === 'pending') query = query.eq('status', 'pending');
  const { data, error } = await query;
  if (error) console.error('deal_promotions:', error.message);
  const rows = (data ?? []) as any[];

  const ownerIds = Array.from(new Set(rows.map(r => r.owner_id)));
  const { data: profiles } = ownerIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', ownerIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const names = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-heading text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 font-bold">Promocje ofert</h1>
        <div className="flex gap-2">
          <a href="?filter=pending" className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === 'pending' ? 'bg-primary text-onPrimary border-primary' : 'border-primary/25 hover:bg-surfaceLow'}`}>Oczekujące</a>
          <a href="?filter=all" className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === 'all' ? 'bg-primary text-onPrimary border-primary' : 'border-primary/25 hover:bg-surfaceLow'}`}>Wszystkie</a>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Właściciel prosi o podbicie oferty dnia na górę listy. Zatwierdź po ustaleniu płatności — promocja startuje od razu.</p>

      <div className="bg-surfaceLowest rounded-2xl border overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Lokal</th>
              <th className="text-left px-4 py-3 font-medium">Oferta</th>
              <th className="text-left px-4 py-3 font-medium">Właściciel</th>
              <th className="text-left px-4 py-3 font-medium">Pakiet</th>
              <th className="text-left px-4 py-3 font-medium">Prośba</th>
              <th className="text-left px-4 py-3 font-medium">Aktywna do</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.places?.name ?? '—'}</td>
                <td className="px-4 py-3">{r.deals?.dish_name ?? '—'}{r.deals?.price != null ? ` · ${r.deals.price} zł` : ''}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{names[r.owner_id] ?? r.owner_id}</td>
                <td className="px-4 py-3 whitespace-nowrap">{PACKAGES[r.package] ?? r.package}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.active_until)}</td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3">
                  {r.status === 'pending'
                    ? <RequestButtons id={r.id} />
                    : r.admin_note && <span className="text-gray-400 text-xs italic truncate max-w-[120px] block">{r.admin_note}</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{filter === 'pending' ? 'Brak oczekujących promocji' : 'Brak promocji'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
