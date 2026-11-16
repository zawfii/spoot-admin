import { getOwnershipRequests } from '@/lib/queries';
import { Badge } from '@/components/ui/Badge';
import { FilterChip } from '@/components/ui/FilterChip';
import { PageHeader } from '@/components/ui/PageHeader';
import { plural } from '@/lib/plural';
import ApproveButton from './ApproveButton';
import RejectButton from './RejectButton';

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending') return <Badge tone="warning">Oczekuje</Badge>;
  if (status === 'approved') return <Badge tone="success">Zatwierdzone</Badge>;
  return <Badge tone="danger">Odrzucone</Badge>;
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] uppercase text-onSurfaceVariant">{label}</dt>
      <dd className={`text-sm font-medium break-words ${mono ? 'font-mono' : ''}`}>{children}</dd>
    </div>
  );
}

export default async function OwnershipRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'pending';
  const requests = await getOwnershipRequests(filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-[1160px] mx-auto">
      <PageHeader
        title="Prośby właścicieli"
        subtitle={pendingCount > 0
          ? `${pendingCount} ${plural(pendingCount, 'czeka', 'czekają', 'czeka')} na decyzję. Zatwierdzenie daje dostęp do panelu lokalu.`
          : 'Nic nie czeka na decyzję.'}
        actions={
          <div role="group" aria-label="Filtr" className="flex gap-2">
            <FilterChip href="?filter=pending" active={filter === 'pending'}>Oczekujące</FilterChip>
            <FilterChip href="?filter=all" active={filter === 'all'}>Wszystkie</FilterChip>
          </div>
        }
      />

      {requests.length === 0 ? (
        <div className="bg-cardMuted rounded-xl px-6 py-10 text-center">
          <p className="font-heading font-semibold">{filter === 'pending' ? 'Brak oczekujących próśb' : 'Brak próśb'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
          {requests.map(req => (
            <article key={req.id} className="bg-cardMuted rounded-xl p-4 lg:p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <h2 className="font-heading font-bold text-[17px] lg:text-lg leading-6">{req.place_name}</h2>
                  <span className="text-[13px] leading-[18px] text-onSurfaceVariant">{req.user_display_name} · {formatDate(req.created_at)}</span>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 p-4 rounded-lg bg-surface">
                <Field label="Imię i nazwisko">{req.full_name ?? '—'}</Field>
                <Field label="Telefon">{req.phone ?? '—'}</Field>
                <Field label="NIP" mono>{req.nip}</Field>
                {req.message && <div className="col-span-2"><Field label="Wiadomość">{req.message}</Field></div>}
              </dl>
              {req.status === 'pending' ? (
                <div className="flex gap-2">
                  <ApproveButton requestId={req.id} />
                  <RejectButton requestId={req.id} />
                </div>
              ) : req.admin_note ? (
                <p className="text-[13px] text-onSurfaceVariant italic">Notatka: {req.admin_note}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
