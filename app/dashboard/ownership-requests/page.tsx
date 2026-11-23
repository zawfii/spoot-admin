import {
  getOwnershipCounts, getOwnershipRequests, getOwnerOverview, getOwnerRecentActivity,
  type OwnershipStatus, type OwnershipRequestRow, type OwnerOverviewRow, type OwnerActivityEvent,
} from '@/lib/queries';
import { Badge } from '@/components/ui/Badge';
import { FilterChip } from '@/components/ui/FilterChip';
import { PageHeader } from '@/components/ui/PageHeader';
import { plural } from '@/lib/plural';
import ApproveButton from './ApproveButton';
import RejectButton from './RejectButton';

const TABS: { value: OwnershipStatus; label: string }[] = [
  { value: 'pending', label: 'Oczekujące' },
  { value: 'approved', label: 'Zatwierdzone' },
  { value: 'rejected', label: 'Odrzucone' },
];

const ENTITY: Record<string, string> = {
  venue_details: 'Profil lokalu',
  venue_photos: 'Zdjęcia',
  menu_sections: 'Sekcje menu',
  menu_items: 'Menu',
  deals: 'Oferty dnia',
  promotions: 'Sponsoring',
};
const ACTION: Record<string, string> = { INSERT: 'dodanie', UPDATE: 'edycja', DELETE: 'usunięcie' };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Warsaw' });
const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' }) : '—';

function device(userAgent: string | null) {
  if (!userAgent) return '';
  if (/iPhone|iPad|iOS|Darwin|CFNetwork/i.test(userAgent)) return 'iPhone';
  if (/Android|okhttp/i.test(userAgent)) return 'Android';
  return 'przeglądarka';
}

function eventLabel(e: OwnerActivityEvent) {
  if (e.kind === 'login') return ['Logowanie', device(e.detail)].filter(Boolean).join(' · ');
  return `${ENTITY[e.entity ?? ''] ?? e.entity} — ${ACTION[e.action ?? ''] ?? e.action}`;
}

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

const CALL_TIMES: Record<string, string> = { rano: 'Rano (9–12)', po_poludniu: 'Po południu (12–16)', wieczorem: 'Wieczorem (16–19)' };

function ContactFields({ req }: { req: OwnershipRequestRow }) {
  return (
    <>
      <Field label="Imię i nazwisko">{req.full_name ?? '—'}</Field>
      <Field label="Telefon">
        {req.phone ? <a href={`tel:${req.phone}`} className="text-primary underline underline-offset-2">{req.phone}</a> : '—'}
      </Field>
      <Field label="Kiedy dzwonić">{CALL_TIMES[req.call_time ?? ''] ?? 'O dowolnej porze'}</Field>
      <Field label="NIP" mono>{req.nip ?? '—'}</Field>
      {req.message && <div className="col-span-2"><Field label="Wiadomość">{req.message}</Field></div>}
    </>
  );
}

function CardHeader({ req }: { req: OwnershipRequestRow }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col min-w-0">
        <h2 className="font-heading font-bold text-[17px] lg:text-lg leading-6">{req.place_name}</h2>
        <span className="text-[13px] leading-[18px] text-onSurfaceVariant">{req.user_display_name} · zgłoszenie {fmtDate(req.created_at)}</span>
      </div>
      <StatusBadge status={req.status} />
    </div>
  );
}

// Lokal dodany przez właściciela razem ze zgłoszeniem — bez punktu na mapie i metra.
function NewPlaceNotice({ req }: { req: OwnershipRequestRow }) {
  if (req.place_status !== 'pending') return null;
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warning">Nowy lokal</Badge>
        {req.place_address && <span className="text-[13px] text-onSurfaceVariant">{req.place_address}</span>}
      </div>
      <p className="text-[13px] text-onSurfaceVariant">
        Lokalu nie było w bazie — właściciel dodał go sam. Najpierw uzupełnij go (punkt na mapie, miasto do synchronizacji) i zatwierdź, potem zatwierdź to zgłoszenie.
      </p>
      <a href={`/dashboard/places/${req.place_id}`} className="self-start text-[13px] font-heading font-semibold text-primary underline underline-offset-2 min-h-9 flex items-center">Otwórz lokal</a>
    </div>
  );
}

function OwnerCard({ req, stats, events }: { req: OwnershipRequestRow; stats?: OwnerOverviewRow; events: OwnerActivityEvent[] }) {
  return (
    <article className="bg-cardMuted rounded-xl p-4 lg:p-5 flex flex-col gap-4">
      <CardHeader req={req} />
      {stats ? (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 p-4 rounded-lg bg-surface">
            <Field label="Ostatnio aktywny">{fmtDateTime(stats.last_active)}</Field>
            <Field label="Ostatnie logowanie">{fmtDateTime(stats.last_sign_in)}</Field>
            <Field label="Logowania">{stats.logins}</Field>
            <Field label="Dni aktywności · 30 dni">{stats.active_days_30}</Field>
            <Field label="Zmiany · 30 dni">{stats.changes_30}</Field>
            <Field label="Ostatnia zmiana">{fmtDateTime(stats.last_change)}</Field>
          </dl>
          <p className="text-[13px] text-onSurfaceVariant">
            W lokalu: menu {stats.menu_items} · oferty dnia {stats.deals} · sponsoring {stats.promotions} · zdjęcia {stats.photos}
          </p>
          {events.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] uppercase text-onSurfaceVariant">Ostatnie zdarzenia</h3>
              <ul className="flex flex-col">
                {events.slice(0, 5).map((e, i) => (
                  <li key={i} className="flex justify-between gap-3 py-1.5 border-b border-outlineVariant last:border-0 text-[13px]">
                    <span>{eventLabel(e)}</span>
                    <span className="text-onSurfaceVariant whitespace-nowrap">{fmtDateTime(e.created_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-[13px] text-onSurfaceVariant">Brak danych o aktywności tego konta.</p>
      )}
      <details className="group">
        <summary className="cursor-pointer text-[13px] font-heading font-semibold text-primary min-h-9 flex items-center">Dane z prośby</summary>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 p-4 mt-1 rounded-lg bg-surface"><ContactFields req={req} /></dl>
      </details>
    </article>
  );
}

export default async function OwnershipRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: OwnershipStatus = tabParam === 'approved' || tabParam === 'rejected' ? tabParam : 'pending';
  const [counts, requests] = await Promise.all([getOwnershipCounts(), getOwnershipRequests(tab)]);

  // Zatwierdzone: aktywność z dziennika (null = migracja jeszcze nie wgrana).
  const overview = tab === 'approved' ? await getOwnerOverview() : null;
  const events = overview ? await getOwnerRecentActivity(Array.from(new Set(requests.map(r => r.user_id)))) : [];
  const statsFor = (req: OwnershipRequestRow) =>
    overview?.find(o => o.owner_id === req.user_id && o.place_id === req.place_id) ?? overview?.find(o => o.owner_id === req.user_id);
  const ordered = tab === 'approved'
    ? [...requests].sort((a, b) => (statsFor(b)?.last_active ?? '').localeCompare(statsFor(a)?.last_active ?? ''))
    : requests;
  const trackingSince = overview?.find(o => o.tracking_since)?.tracking_since ?? null;

  const subtitle = {
    pending: counts.pending > 0
      ? `${counts.pending} ${plural(counts.pending, 'czeka', 'czekają', 'czeka')} na telefon. Zadzwoń, potwierdź lokal i zatwierdź — to otwiera panel.`
      : 'Nic nie czeka na decyzję.',
    approved: 'Właściciele z dostępem do panelu lokalu — od ostatnio aktywnych.',
    rejected: 'Odrzucone prośby i powód odrzucenia.',
  }[tab];

  return (
    <div className="max-w-[1160px] mx-auto">
      <PageHeader title="Właściciele" subtitle={subtitle} />

      <div role="group" aria-label="Status próśb" className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        {TABS.filter(t => t.value !== 'rejected' || counts.rejected > 0 || tab === 'rejected').map(t => (
          <FilterChip key={t.value} href={`?tab=${t.value}`} active={tab === t.value}>
            {t.label}
            <span className={`ml-2 min-w-[22px] h-[22px] px-1.5 rounded-full text-xs leading-[22px] text-center ${tab === t.value ? 'bg-white/20' : 'bg-cardMutedDark'}`}>
              {counts[t.value]}
            </span>
          </FilterChip>
        ))}
      </div>

      {tab === 'approved' && (
        <p className="text-[13px] text-onSurfaceVariant mb-4">
          {overview === null
            ? 'Dziennik aktywności nie jest jeszcze włączony w bazie — pokazuję same prośby.'
            : `Logowania, dni aktywności i zmiany liczone od ${trackingSince ? fmtDate(trackingSince) : 'włączenia dziennika'}. Ostatnie logowanie, aktywność i zmiana — także sprzed tej daty.`}
        </p>
      )}

      {ordered.length === 0 ? (
        <div className="bg-cardMuted rounded-xl px-6 py-10 text-center">
          <p className="font-heading font-semibold">
            {{ pending: 'Brak oczekujących próśb', approved: 'Brak zatwierdzonych właścicieli', rejected: 'Brak odrzuconych próśb' }[tab]}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4 items-start">
          {ordered.map(req =>
            tab === 'approved' ? (
              <OwnerCard key={req.id} req={req} stats={statsFor(req)} events={events.filter(e => e.owner_id === req.user_id)} />
            ) : (
              <article key={req.id} className="bg-cardMuted rounded-xl p-4 lg:p-5 flex flex-col gap-4">
                <CardHeader req={req} />
                <NewPlaceNotice req={req} />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 p-4 rounded-lg bg-surface"><ContactFields req={req} /></dl>
                {req.status === 'pending' ? (
                  <div className="flex gap-2">
                    <ApproveButton requestId={req.id} />
                    <RejectButton requestId={req.id} />
                  </div>
                ) : req.admin_note ? (
                  <p className="text-[13px] text-onSurfaceVariant italic">Powód: {req.admin_note}</p>
                ) : null}
              </article>
            )
          )}
        </div>
      )}
    </div>
  );
}
