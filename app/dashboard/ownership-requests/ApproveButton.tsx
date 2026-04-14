'use client';

import { useState } from 'react';
import { approveOwnershipRequest } from '@/app/actions/ownership';

export default function ApproveButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    if (!confirm('Zatwierdzić prośbę? Właściciel uzyska dostęp do panelu.')) return;
    setLoading(true);
    const result = await approveOwnershipRequest(requestId);
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
