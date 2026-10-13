'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('error') === 'unauthorized' ? 'Brak dostępu do panelu.' : '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const err = await login(email, password);
    if (err) {
      setError(err);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-outlineVariant rounded-md px-3 py-2.5 text-sm bg-surfaceLowest focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Hasło</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-outlineVariant rounded-md px-3 py-2.5 text-sm bg-surfaceLowest focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logowanie...' : 'Zaloguj się'}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Card className="w-full max-w-sm shadow-sm p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-xs font-medium text-onSurfaceVariant tracking-wide uppercase">Spoot</span>
        </div>
        <h1 className="text-2xl font-heading font-bold mb-6 text-onSurface">Panel administracyjny</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </Card>
    </div>
  );
}
