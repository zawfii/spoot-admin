'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/Logo';

// Cel linku z maila (zaproszenie pracownika albo reset hasła z manage-staff).
// Supabase dokleja sesję we fragmencie adresu (#access_token=…). Klient panelu
// działa w trybie PKCE i sam takiego linku nie przyjmie, więc sesję ustawiamy ręcznie.
export default function SetPasswordPage() {
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    window.history.replaceState(null, '', window.location.pathname); // tokeny nie zostają w adresie
    if (!access_token || !refresh_token) { setReady(false); return; }
    createClient().auth.setSession({ access_token, refresh_token }).then(({ error }) => setReady(!error));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await createClient().auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = '/dashboard';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <Logo size={28} />
        <h1 className="text-2xl font-heading font-bold mt-3 mb-6 text-onSurface">Ustaw hasło</h1>
        {ready === null && <p className="text-sm text-onSurfaceVariant">Sprawdzam link...</p>}
        {ready === false && (
          <p className="text-sm text-red-600">Link wygasł albo został już użyty. Poproś administratora o ponowne wysłanie maila.</p>
        )}
        {ready && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-onSurfaceVariant">Nowe hasło (min. 8 znaków)</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-outlineVariant rounded-md px-3 py-2.5 text-sm bg-surfaceLowest focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Zapisywanie...' : 'Zapisz i wejdź do panelu'}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
