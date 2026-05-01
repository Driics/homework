import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.js';
import { useLogin } from '../api/queries.js';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      navigate('/cards', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not log in. Please try again.');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-[var(--tg-hint-color,#999)]">Sign in to view your cards.</p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--tg-section-separator-color,#e5e7eb)] bg-transparent px-3 py-2 text-base outline-none focus:border-[var(--tg-button-color,#3390ec)]"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--tg-section-separator-color,#e5e7eb)] bg-transparent px-3 py-2 text-base outline-none focus:border-[var(--tg-button-color,#3390ec)]"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-lg bg-[var(--tg-button-color,#3390ec)] px-4 py-2.5 text-base font-medium text-[var(--tg-button-text-color,#fff)] disabled:opacity-50"
        >
          {login.isPending ? 'Signing in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
