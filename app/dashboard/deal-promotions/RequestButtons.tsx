'use client';

import { useState } from 'react';
import { approveDealPromotion, rejectDealPromotion } from '@/app/actions/owner-requests';

export default function RequestButtons({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<{ error?: string }>) {
    setLoading(true);
    const result = await fn();
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => confirm('Zatwierdzić promocję? Oferta od razu trafi na górę Ofert dnia.') && run(() => approveDealPromotion(id))}
        disabled={loading}
        className="min-h-9 px-3.5 rounded-lg bg-primary text-onPrimary text-sm font-heading font-semibold hover:bg-primaryLight disabled:opacity-50"
      >
        {loading ? '...' : 'Zatwierdź'}
      </button>
      <button
        onClick={() => {
          const note = prompt('Powód odrzucenia (opcjonalnie):');
          if (note !== null) run(() => rejectDealPromotion(id, note));
        }}
        disabled={loading}
        className="min-h-9 px-3.5 rounded-lg border border-primary/25 text-primary text-sm font-heading font-semibold hover:bg-surfaceLow disabled:opacity-50"
      >
        Odrzuć
      </button>
    </div>
  );
}
