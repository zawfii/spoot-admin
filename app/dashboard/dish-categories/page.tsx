import { getDishCategorySuggestions } from '@/lib/queries';
import ApproveButton from './ApproveButton';
import RejectButton from './RejectButton';

export default async function DishCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'pending';
  const suggestions = await getDishCategorySuggestions(filter);

  function statusBadge(status: string) {
    if (status === 'pending') return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">Oczekuje</span>;
    if (status === 'approved') return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">Zatwierdzone</span>;
    return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">Odrzucone</span>;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 font-bold">Nowe kategorie dań</h1>
        <div className="flex gap-2">
          <a href="?filter=pending" className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === 'pending' ? 'bg-primary text-onPrimary border-primary' : 'bg-cardMuted border-transparent hover:bg-cardMutedDark'}`}>
            Oczekujące
          </a>
          <a href="?filter=all" className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === 'all' ? 'bg-primary text-onPrimary border-primary' : 'bg-cardMuted border-transparent hover:bg-cardMutedDark'}`}>
            Wszystkie
          </a>
        </div>
      </div>

      <div className="bg-surfaceLowest rounded-2xl border overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Sugerowana kategoria</th>
              <th className="text-left px-4 py-3 font-medium">Przykładowe danie</th>
              <th className="text-left px-4 py-3 font-medium">Zgłoszeń</th>
              <th className="text-left px-4 py-3 font-medium">Uzasadnienie AI</th>
              <th className="text-left px-4 py-3 font-medium">Data</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map(s => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.suggested_name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{s.dish_name}</td>
                <td className="px-4 py-3 text-gray-700">{s.occurrence_count}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate" title={s.ai_verdict?.reasoning ?? ''}>
                  {s.ai_verdict?.reasoning ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(s.created_at)}</td>
                <td className="px-4 py-3">{statusBadge(s.status)}</td>
                <td className="px-4 py-3">
                  {s.status === 'pending' && (
                    <div className="flex gap-2">
                      <ApproveButton suggestionId={s.id} />
                      <RejectButton suggestionId={s.id} />
                    </div>
                  )}
                  {s.status === 'approved' && s.pr_url && (
                    <a href={s.pr_url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">
                      Zobacz PR
                    </a>
                  )}
                  {s.status === 'rejected' && s.admin_note && (
                    <span className="text-gray-400 text-xs italic truncate max-w-[120px] block">{s.admin_note}</span>
                  )}
                </td>
              </tr>
            ))}
            {suggestions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {filter === 'pending' ? 'Brak oczekujących sugestii' : 'Brak sugestii'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
