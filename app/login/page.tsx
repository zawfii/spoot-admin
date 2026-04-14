'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from '@/app/actions/auth';

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
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Hasło</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Logowanie...' : 'Zaloguj się'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Spoot Admin</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
