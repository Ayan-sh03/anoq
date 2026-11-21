'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/auth/api';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'register';
  next: string;
}

export function AccountForm({ mode, next }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    family_name: '',
    given_name: '',
  });
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorText("");

    try {
      if (mode === 'login') {
        await authApi.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        const length = new TextEncoder().encode(formData.password).length;
        if (length < 8 || length > 72) throw new Error("Use a password between 8 and 72 bytes.");
        await authApi.register({
          email: formData.email,
          password: formData.password,
          username: formData.username || undefined,
          family_name: formData.family_name || undefined,
          given_name: formData.given_name || undefined,
        });
      }

      // Cookie mutations happen in Go. Reload to discard prefetched, signed-out pages.
      window.location.replace(next);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Couldn’t complete this request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const creating = mode === "register";
  const otherPage = creating ? "/login" : "/register";
  return (
    <form onSubmit={handleSubmit} className="paper-panel account-form">
      <div className="page-heading">
        <p className="kicker"><span className="ink-line" /> Your workspace</p>
        <h1>{creating ? "Create an account." : "Welcome back."}</h1>
        <p>{creating ? "Set up an account to collect feedback." : "Sign in to manage your feedback forms."}</p>
      </div>
      <div className="field-stack">
        <label>Email<Input type="email" autoComplete="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="you@example.com" /></label>
        <label>Password<Input type="password" autoComplete={creating ? "new-password" : "current-password"} name="password" value={formData.password} onChange={handleInputChange} aria-describedby={creating ? "password-guidance" : undefined} required /></label>
        {creating && <p id="password-guidance" className="panel-note">Use 8–72 bytes. Letters A–Z, numbers, and standard punctuation use one byte each.</p>}
        {creating && <details className="details-block">
          <summary>Profile details <span>(optional)</span></summary>
          <div className="field-stack">
            <label>Username<Input name="username" autoComplete="username" value={formData.username} onChange={handleInputChange} /></label>
            <label>First name<Input name="given_name" autoComplete="given-name" value={formData.given_name} onChange={handleInputChange} /></label>
            <label>Last name<Input name="family_name" autoComplete="family-name" value={formData.family_name} onChange={handleInputChange} /></label>
          </div>
        </details>}
      </div>
      {errorText && <p className="form-error" role="alert">{errorText}</p>}
      <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="animate-spin" />Please wait…</> : <>{creating ? "Create account" : "Sign in"}<ArrowRight /></>}</Button>
      <p className="account-switch">{creating ? "Already have an account?" : "New to Anoq?"} <Link href={`${otherPage}?next=${encodeURIComponent(next)}`}>{creating ? "Sign in" : "Create an account"}</Link></p>
    </form>
  );
}
