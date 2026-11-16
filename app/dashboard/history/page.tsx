import { requireAdmin } from '@/lib/admin';
import { PageHeader } from '@/components/ui/PageHeader';

const PAGE = 50;

const TABLES: Record<string, string> = {
  places: 'Miejsce', spoot_lists: 'Lista Spoot', spoot_list_places: 'Miejsce na liście',
  spoot_guides: 'Przewodnik', spoot_guide_places: 'Miejsce w przewodniku', guide_blocks: 'Blok przewodnika',
  featured_places: 'Wyróżnione', deals: 'Oferta dnia', deal_promotions: 'Promocja oferty',
  promotions: 'Sponsoring', ownership_requests: 'Zgłoszenie właściciela', menu_entry_requests: 'Prośba o menu',
  website_requests: 'Strona lokalu', dish_category_suggestions: 'Kategoria dań', content_reports: 'Zgłoszenie treści',
  ratings: 'Ocena', staff: 'Pracownik',
};

const ACTIONS: Record<string, { label: string; cls: string }> = {
  INSERT: { label: 'Dodano', cls: 'bg-green-100 text-green-800' },
  UPDATE: { label: 'Zmieniono', cls: 'bg-amber-100 text-amber-800' },
  DELETE: { label: 'Usunięto', cls: 'bg-red-100 text-red-700' },
};

type Entry = {
  id: number; actor_id: string | null; actor_name: string | null; table_name: string; row_id: string | null;
  row_label: string | null; action: string; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null;
  created_at: string;
};

function show(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

const chip = (active: boolean) =>
  `inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border whitespace-nowrap ${active ? 'bg-primary text-onPrimary border-primary' : 'border-primary/25 hover:bg-surfaceLow'}`;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ actor?: string; page?: string }> }) {
  const { actor, page: pageParam } = await searchParams;
  const page = Math.max(0, Number(pageParam) || 0);
  const supabase = await requireAdmin();

  let query = supabase
    .from('admin_audit_log')
    .select('id, actor_id, actor_name, table_name, row_id, row_label, action, old_data, new_data, created_at')
    .order('id', { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE); // o jeden więcej = wiemy, czy jest następna strona
  if (actor) query = query.eq('actor_id', actor);

  const [{ data, error }, { data: staff }] = await Promise.all([
    query,
    supabase.from('staff').select('user_id, name').order('name'),
  ]);
  if (error) console.error('admin_audit_log:', error.message);
  const rows = ((data ?? []) as Entry[]).slice(0, PAGE);
  const hasNext = (data?.length ?? 0) > PAGE;
  const link = (p: number) => `?${new URLSearchParams({ ...(actor ? { actor } : {}), page: String(p) })}`;

  return (
    <div>
      <PageHeader title="Historia zmian" subtitle="Każda zmiana wprowadzona przez Ciebie i pracowników — w panelu i na ekranach admina w aplikacji. Wpisów nie da się edytować ani usunąć." />
      <div role="group" aria-label="Osoba" className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        <a href="?" className={chip(!actor)}>Wszyscy</a>
        {(staff ?? []).map(s => (
          <a key={s.user_id} href={`?actor=${s.user_id}`} className={chip(actor === s.user_id)}>{s.name}</a>
        ))}
      </div>

      <div className="bg-surfaceLowest rounded-2xl border overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Kiedy</th>
              <th className="text-left px-4 py-3 font-medium">Kto</th>
              <th className="text-left px-4 py-3 font-medium">Co</th>
              <th className="text-left px-4 py-3 font-medium">Szczegóły</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(e => {
              const action = ACTIONS[e.action] ?? { label: e.action, cls: 'bg-gray-100' };
              const label = e.row_label ?? e.row_id ?? '';
              return (
                <tr key={e.id} className="border-b last:border-0 align-top">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' })}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{e.actor_name ?? 'Usunięte konto'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${action.cls}`}>{action.label}</span>
                    <span className="ml-2 text-gray-500">{TABLES[e.table_name] ?? e.table_name}</span>
                    <div className="mt-1 font-medium break-words">
                      {e.table_name === 'places' && e.row_id && e.action !== 'DELETE'
                        ? <a href={`/dashboard/places/${e.row_id}`} className="underline underline-offset-2">{label}</a>
                        : label}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {e.action === 'UPDATE'
                      ? Object.keys(e.new_data ?? {}).map(key => (
                          <div key={key} className="break-words">
                            <span className="font-medium">{key}:</span>{' '}
                            <span className="text-gray-500 line-through">{show(e.old_data?.[key])}</span>{' → '}{show(e.new_data?.[key])}
                          </div>
                        ))
                      : (
                        <details>
                          <summary className="cursor-pointer text-gray-500">Pokaż dane</summary>
                          <pre className="mt-1 whitespace-pre-wrap break-all text-gray-600">{JSON.stringify(e.new_data ?? e.old_data, null, 1)}</pre>
                        </details>
                      )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Brak zmian</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(page > 0 || hasNext) && (
        <div className="flex justify-between mt-4">
          {page > 0 ? <a href={link(page - 1)} className={chip(false)}>Nowsze</a> : <span />}
          {hasNext && <a href={link(page + 1)} className={chip(false)}>Starsze</a>}
        </div>
      )}
    </div>
  );
}
