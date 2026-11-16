'use client';

import { useState } from 'react';
import { rejectPromotion } from '@/app/actions/promotions';

export default function RejectPromotionButton({ promotionId }: { promotionId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    const note = prompt('Powód odrzucenia (opcjonalnie):') ?? '';
    if (note === null) return;
    setLoading(true);
    const result = await rejectPromotion(promotionId, note);
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
