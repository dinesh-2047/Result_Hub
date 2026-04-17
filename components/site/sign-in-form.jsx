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
    <div className="surface auth-card">
      <h1 className="page-title auth-card__title">Sign In</h1>
      <p className="muted auth-card__subtitle">Use your email or roll number to access your account</p>

      <form onSubmit={submitForm} className="form-grid auth-card__form">
        <label className="field">
          <span>Email or Roll Number</span>
          <input type="text" name="identifier" value={form.identifier} onChange={updateField} placeholder="you@example.com or 23002001" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" value={form.password} onChange={updateField} placeholder="••••••••" required />
        </label>
        <button className="primary-button auth-card__submit" type="submit" disabled={isPending}>
          {isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="muted auth-card__note">
        Students can sign in with roll number or email. Default password is your roll number.
      </p>
    </div>
  );
}