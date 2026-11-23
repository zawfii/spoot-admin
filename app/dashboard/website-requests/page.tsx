import { createClient } from '@/lib/supabase/server';
import StatusButtons from './StatusButtons';

// Ceny netto jak w spotto-web/lib/website-packages.ts (tam jest źródło prawdy). Stworzenie strony: 0 zł.
const PACKAGES: Record<string, { label: string; monthly: { yearly: number; monthly: number } | null }> = {
  wizytowka: { label: 'Wizytówka', monthly: { yearly: 59, monthly: 79 } },
  plus: { label: 'Strona Plus', monthly: { yearly: 99, monthly: 129 } },
  custom: { label: 'Na zamówienie', monthly: null },
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Do decyzji', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'W przygotowaniu', cls: 'bg-blue-100 text-blue-800' },
  done: { label: 'Działa', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Odrzucona', cls: 'bg-gray-100 text-gray-600' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function dueNow(pkg: string, billing: 'yearly' | 'monthly') {
  const m = PACKAGES[pkg]?.monthly?.[billing];
  if (m == null) return 'wycena';
  return `${billing === 'yearly' ? 12 * m : m} zł`;
}

export default async function WebsiteRequestsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'open';
  const supabase = createClient();

  let query = supabase
    .from('website_requests')
    .select('id, place_id, owner_id, package, billing, slug, phone, status, admin_note, created_at, places(name)')
    .order('created_at', { ascending: false });
  if (filter === 'open') query = query.in('status', ['pending', 'approved']);
  const { data, error } = await query;
  if (error) console.error('website_requests:', error.message);
  const rows = (data ?? []) as any[];

  const ownerIds = Array.from(new Set(rows.map(r => r.owner_id)));
  const { data: profiles } = ownerIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', ownerIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const names = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-heading text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 font-bold">Strony lokali</h1>
        <div className="flex gap-2">
          <a href="?filter=open" className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === 'open' ? 'bg-primary text-onPrimary border-primary' : 'border-primary/25 hover:bg-surfaceLow'}`}>Otwarte</a>
          <a href="?filter=all" className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === 'all' ? 'bg-primary text-onPrimary border-primary' : 'border-primary/25 hover:bg-surfaceLow'}`}>Wszystkie</a>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Właściciel zamówił stronę pod spootme.pl/&lt;adres&gt;. Zadzwoń, ustal szczegóły i płatność, zatwierdź, a gdy strona działa — oznacz „Strona działa”. Kwoty netto.</p>

      <div className="bg-surfaceLowest rounded-2xl border overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Lokal</th>
              <th className="text-left px-4 py-3 font-medium">Właściciel</th>
              <th className="text-left px-4 py-3 font-medium">Pakiet</th>
              <th className="text-left px-4 py-3 font-medium">Na start</th>
              <th className="text-left px-4 py-3 font-medium">Adres</th>
              <th className="text-left px-4 py-3 font-medium">Telefon</th>
              <th className="text-left px-4 py-3 font-medium">Kiedy</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const st = STATUS[r.status] ?? STATUS.pending;
              return (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-medium">
                    <a href={`/dashboard/places/${r.place_id}`} className="underline underline-offset-2">{r.places?.name ?? '—'}</a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{names[r.owner_id] ?? r.owner_id}</td>
                  <td className="px-4 py-3">
                    {PACKAGES[r.package]?.label ?? r.package}
                    <span className="block text-xs text-gray-500">{r.billing === 'yearly' ? '12 mies. z góry' : 'co miesiąc'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{dueNow(r.package, r.billing)}</td>
                  <td className="px-4 py-3">spootme.pl/{r.slug}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.phone ? <a href={`tel:${r.phone}`} className="underline underline-offset-2">{r.phone}</a> : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    {r.admin_note && <span className="block mt-1 text-xs text-gray-500">{r.admin_note}</span>}
                  </td>
                  <td className="px-4 py-3"><StatusButtons id={r.id} status={r.status} /></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">{filter === 'open' ? 'Brak otwartych próśb' : 'Brak próśb'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
