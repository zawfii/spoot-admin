'use client';

import { useState } from 'react';
import { addStaff } from '@/app/actions/staff';
import { Button } from '@/components/ui/Button';

const input = 'w-full border border-outlineVariant rounded-md px-3 py-2.5 text-sm bg-surfaceLowest focus:outline-none focus:ring-2 focus:ring-secondary';

export default function StaffForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await addStaff(email, name);
    setLoading(false);
    if (result.error) { setMessage({ text: result.error, error: true }); return; }
    setMessage({ text: `Wysłano maila na ${email}. Po ustawieniu hasła ta osoba zaloguje się do panelu.`, error: false });
    setEmail('');
    setName('');
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surfaceLowest rounded-2xl border p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[200px] text-sm font-medium text-onSurfaceVariant">
          Imię i nazwisko
          <input required maxLength={80} value={name} onChange={e => setName(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="flex-1 min-w-[220px] text-sm font-medium text-onSurfaceVariant">
          E-mail
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={`${input} mt-1`} />
        </label>
        <Button type="submit" disabled={loading}>{loading ? 'Wysyłanie...' : 'Dodaj pracownika'}</Button>
      </div>
      {message && (
        <p role="status" className={`mt-3 text-sm ${message.error ? 'text-red-600' : 'text-onSurfaceVariant'}`}>{message.text}</p>
      )}
    </form>
  );
}
