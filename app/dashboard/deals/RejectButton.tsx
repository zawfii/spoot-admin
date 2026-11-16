'use client';

import { useState } from 'react';
import { rejectDeal } from '@/app/actions/deals';

export default function RejectButton({ dealId }: { dealId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    const note = prompt('Powód odrzucenia (opcjonalnie):') ?? '';
    if (note === null) return;
    setLoading(true);
    const result = await rejectDeal(dealId, note);
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
  }

  return (
    <button
      onClick={handleReject}
      disabled={loading}
      className="min-h-9 px-3.5 rounded-lg border border-primary/25 text-primary text-sm font-heading font-semibold hover:bg-surfaceLow disabled:opacity-50"
    >
      {loading ? '...' : 'Odrzuć'}
    </button>
  );
}
