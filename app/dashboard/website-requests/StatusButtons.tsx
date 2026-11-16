'use client';

import { useState } from 'react';
import { setWebsiteRequestStatus } from '@/app/actions/owner-requests';

type Status = 'pending' | 'approved' | 'rejected' | 'done';

const btn = 'min-h-9 px-3.5 rounded-lg text-sm font-heading font-semibold disabled:opacity-50';
const primary = `${btn} bg-primary text-onPrimary hover:bg-primaryLight`;
const outline = `${btn} border border-primary/25 text-primary hover:bg-surfaceLow`;

export default function StatusButtons({ id, status }: { id: string; status: Status }) {
  const [loading, setLoading] = useState(false);

  async function set(next: Exclude<Status, 'pending'>) {
    let note: string | undefined;
    if (next === 'rejected') {
      const answer = prompt('Powód odrzucenia (zobaczy go właściciel, opcjonalnie):');
      if (answer === null) return;
      note = answer.trim();
    } else if (next === 'done' && !confirm('Oznaczyć jako zrobione? Zrób to, gdy strona działa pod podanym adresem.')) {
      return;
    }
    setLoading(true);
    const result = await setWebsiteRequestStatus(id, next, note);
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
  }

  if (status === 'pending') {
    return (
      <div className="flex gap-2">
        <button onClick={() => set('approved')} disabled={loading} className={primary}>Zatwierdź</button>
        <button onClick={() => set('rejected')} disabled={loading} className={outline}>Odrzuć</button>
      </div>
    );
  }
  if (status === 'approved') {
    return <button onClick={() => set('done')} disabled={loading} className={primary}>Strona działa</button>;
  }
  return null;
}
