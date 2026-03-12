'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function SignInForm() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [isPending, startTransition] = useTransition();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitForm(event) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.message || 'Unable to sign in.');
        return;
      }

      toast.success(payload.message || 'Signed in.');

      router.push(payload.user.role === 'admin' ? '/admin' : '/dashboard');
      router.refresh();
    });
  }

  return (
    <div className="surface" style={{ maxWidth: 440, margin: '0 auto' }}>
      <h1 className="page-title" style={{ textAlign: 'center' }}>Sign In</h1>
      <p className="muted" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Use your email or roll number to access your account</p>

      <form onSubmit={submitForm} style={{ display: 'grid', gap: '1rem' }}>
        <label className="field">
          <span>Email or Roll Number</span>
          <input type="text" name="identifier" value={form.identifier} onChange={updateField} placeholder="you@example.com or 23002001" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" value={form.password} onChange={updateField} placeholder="••••••••" required />
        </label>
        <button className="primary-button" type="submit" disabled={isPending} style={{ width: '100%' }}>
          {isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: '1rem', fontSize: '0.8125rem', textAlign: 'center' }}>
        Students can sign in with roll number or email. Default password is your roll number.
      </p>
    </div>
  );
}