'use client';

import { useState } from 'react';
import { approveDeal } from '@/app/actions/deals';

export default function ApproveButton({ dealId }: { dealId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveDeal(dealId);
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs hover:bg-green-600 disabled:opacity-50"
    >
      {loading ? '...' : 'Zatwierdź'}
    </button>
  );
}
