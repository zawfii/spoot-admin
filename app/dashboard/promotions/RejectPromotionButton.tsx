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
      className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs hover:bg-red-200 disabled:opacity-50"
    >
      {loading ? '...' : 'Odrzuć'}
    </button>
  );
}
