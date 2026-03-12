'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isPending, startTransition] = useTransition();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.message || 'Unable to send message.');
        return;
      }

      toast.success(payload.message || 'Message sent.');
      setForm({ name: '', email: '', message: '' });
    });
  }

  return (
    <form className="form-panel form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input name="name" value={form.name} onChange={updateField} placeholder="Your name" required />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" value={form.email} onChange={updateField} placeholder="Your email" required />
      </label>
      <label className="field-full">
        <span>Message</span>
        <textarea name="message" value={form.message} onChange={updateField} placeholder="Tell us what you need" required />
      </label>
      <div className="field-full contact-form__actions">
        <button className="primary-button" type="submit" disabled={isPending}>
          {isPending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  );
}