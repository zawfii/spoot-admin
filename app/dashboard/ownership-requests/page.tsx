import { getOwnershipRequests } from '@/lib/queries';
import ApproveButton from './ApproveButton';
import RejectButton from './RejectButton';

export default async function OwnershipRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'pending';
  const requests = await getOwnershipRequests(filter);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Prośby właścicieli</h1>
        <div className="flex gap-2">
          <a href="?filter=pending" className={`px-3 py-1.5 rounded-lg text-sm border ${filter === 'pending' ? 'bg-black text-white border-black' : 'hover:bg-gray-50'}`}>
            Oczekujące
          </a>
          <a href="?filter=all" className={`px-3 py-1.5 rounded-lg text-sm border ${filter === 'all' ? 'bg-black text-white border-black' : 'hover:bg-gray-50'}`}>
            Wszystkie
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Lokal</th>
              <th className="text-left px-4 py-3 font-medium">Imię i nazwisko</th>
              <th className="text-left px-4 py-3 font-medium">Telefon</th>
              <th className="text-left px-4 py-3 font-medium">NIP</th>
              <th className="text-left px-4 py-3 font-medium">Data</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{req.place_name}</td>
                <td className="px-4 py-3 text-gray-700">{req.full_name ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{req.phone ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 font-mono">{req.nip}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(req.created_at)}</td>
                <td className="px-4 py-3">{statusBadge(req.status)}</td>
                <td className="px-4 py-3">
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <ApproveButton requestId={req.id} />
                      <RejectButton requestId={req.id} />
                    </div>
                  )}
                  {req.status !== 'pending' && req.admin_note && (
                    <span className="text-gray-400 text-xs italic truncate max-w-[120px] block">{req.admin_note}</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {filter === 'pending' ? 'Brak oczekujących prośb' : 'Brak prośb'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
