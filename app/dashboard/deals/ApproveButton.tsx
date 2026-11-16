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
      className="min-h-9 px-3.5 rounded-lg bg-primary text-onPrimary text-sm font-heading font-semibold hover:bg-primaryLight disabled:opacity-50"
    >
      {loading ? '...' : 'Zatwierdź'}
    </button>
  );
}
