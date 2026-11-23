import { createClient } from '@/lib/supabase/server';
import { markOwnerQuestionDone } from '@/app/actions/owner-requests';
import DoneButton from '../menu-requests/DoneButton';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Pytania z banera „Masz pytanie?” na spootme.pl/dla-restauracji (tabela owner_questions).
export default async function OwnerQuestionsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'pending';
  const supabase = createClient();

  let query = supabase
    .from('owner_questions')
    .select('id, name, phone, message, status, created_at')
    .order('created_at', { ascending: false });
  if (filter === 'pending') query = query.eq('status', 'pending');
  const { data, error } = await query;
  if (error) console.error('owner_questions:', error.message);
  const rows = data ?? [];

  const tab = (value: 'pending' | 'all', label: string) => (
    <a href={`?filter=${value}`} className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border ${filter === value ? 'bg-primary text-onPrimary border-primary' : 'border-primary/25 hover:bg-surfaceLow'}`}>{label}</a>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-heading text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 font-bold">Pytania restauracji</h1>
        <div className="flex gap-2">{tab('pending', 'Do oddzwonienia')}{tab('all', 'Wszystkie')}</div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Ktoś zostawił numer w banerze na stronie dla restauracji. Oddzwoń w ciągu 1 dnia roboczego i oznacz jako załatwione.</p>

      <div className="bg-surfaceLowest rounded-2xl border overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Imię</th>
              <th className="text-left px-4 py-3 font-medium">Telefon</th>
              <th className="text-left px-4 py-3 font-medium">Pytanie</th>
              <th className="text-left px-4 py-3 font-medium">Kiedy</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50 align-top">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 whitespace-nowrap"><a href={`tel:${r.phone.replace(/\s/g, '')}`} className="underline underline-offset-2">{r.phone}</a></td>
                <td className="px-4 py-3 max-w-[420px] whitespace-pre-wrap break-words">{r.message ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  {r.status === 'pending'
                    ? <DoneButton id={r.id} action={markOwnerQuestionDone} confirmText="Oznaczyć pytanie jako załatwione? Zrób to po rozmowie." label="Załatwione" />
                    : <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">Załatwione</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{filter === 'pending' ? 'Nikt nie czeka na telefon' : 'Brak pytań'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
