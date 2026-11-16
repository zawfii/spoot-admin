'use client';

import { useState } from 'react';
import { addStaff, revokeStaff } from '@/app/actions/staff';
import { Button } from '@/components/ui/Button';

export default function StaffActions({ userId, email, name, active }: { userId: string; email: string; name: string; active: boolean }) {
  const [loading, setLoading] = useState(false);

  async function run(action: () => Promise<{ error?: string }>, done?: string) {
    setLoading(true);
    const result = await action();
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
    else if (done) alert(done);
  }

  // Ponowne dodanie = ten sam mail jeszcze raz (zgubione zaproszenie) albo przywrócenie dostępu.
  const resend = () => run(() => addStaff(email, name), `Wysłano maila na ${email}.`);

  if (!active) return <Button variant="ghost" size="sm" disabled={loading} onClick={resend}>Przywróć dostęp</Button>;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" disabled={loading} onClick={resend}>Wyślij maila ponownie</Button>
      <Button
        variant="danger"
        size="sm"
        disabled={loading}
        onClick={() => confirm(`Odebrać dostęp: ${name}? Historia zmian tej osoby zostaje.`) && run(() => revokeStaff(userId))}
      >
        Odbierz dostęp
      </Button>
    </div>
  );
}
