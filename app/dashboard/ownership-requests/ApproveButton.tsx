'use client';

import { useState } from 'react';
import { approveOwnershipRequest } from '@/app/actions/ownership';
import { Button } from '@/components/ui/Button';

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
    <Button onClick={handleApprove} disabled={loading} className="flex-1">
      {loading ? 'Zapisuję…' : 'Zatwierdź'}
    </Button>
  );
}
