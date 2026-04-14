'use client';

import { useState } from 'react';
import { rejectOwnershipRequest } from '@/app/actions/ownership';

export default function RejectModal({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleReject() {
    setLoading(true);
    const result = await rejectOwnershipRequest(requestId, note);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-4">Odrzuć prośbę</h2>
        <label className="block text-sm font-medium mb-1">Notatka dla właściciela (opcjonalna)</label>
        <textarea
          className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
          rows={4}
          placeholder="Np. 'Nie znaleźliśmy podanego NIP w CEIDG'"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={400}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
          >
            Anuluj
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Odrzucam...' : 'Odrzuć'}
          </button>
        </div>
      </div>
    </div>
  );
}
