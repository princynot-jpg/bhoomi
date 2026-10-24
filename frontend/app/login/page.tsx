"use client";

import { ArrowLeft, ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import ThemeToggle from "@/components/theme-toggle";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-topbar">
        <Link className="login-brand" href="/"><span className="login-brand-mark"><Leaf size={16} /></span><span>Bhoomi</span></Link>
        <ThemeToggle />
      </div>
      <section className="login-layout">
        <div className="login-story">
          <div className="login-story-kicker"><span /> A SHARED GROUND FOR PROGRESS</div>
          <h1>Every parcel has<br />a <em>bigger picture.</em></h1>
          <p>Bring projects, places and people into one thoughtful view. Move land acquisition forward—with clarity at every step.</p>
          <div className="login-orbit-scene" aria-hidden="true">
            <div className="orbit-ring orbit-ring-one" /><div className="orbit-ring orbit-ring-two" /><div className="orbit-ring orbit-ring-three" />
            <div className="orbit-core"><Leaf size={25} /></div>
            <span className="orbit-node orbit-node-one"><LockKeyhole size={13} /></span>
            <span className="orbit-node orbit-node-two"><ShieldCheck size={13} /></span>
            <span className="orbit-node orbit-node-three"><Leaf size={13} /></span>
            <span className="orbit-caption orbit-caption-one">SECURE BY DESIGN</span>
            <span className="orbit-caption orbit-caption-two">BUILT AROUND PEOPLE</span>
          </div>
          <div className="login-story-footer"><span><i /> ROLE-BASED ACCESS</span><span><i /> DISTRICT-AWARE</span><span><i /> MADE FOR INDIA</span></div>
        </div>
        <div className="login-form-side">
          <div className="login-form-card">
            <Link className="login-back" href="/"><ArrowLeft size={14} /> Back to overview</Link>
            <span className="login-form-kicker">WELCOME BACK</span>
            <h2>Sign in to Bhoomi<span>.</span></h2>
            <p>Pick up where your team left off.</p>
            <form onSubmit={handleSubmit}>
              <label className="login-label" htmlFor="email">Work email</label>
              <div className="login-input-wrap"><Mail size={16} /><input autoComplete="email" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@department.gov.in" required type="email" value={email} /></div>
              <div className="login-password-label"><label className="login-label" htmlFor="password">Password</label><button className="forgot-button" onClick={() => setError("Password recovery is not configured yet. Contact your workspace administrator.")} type="button">Forgot password?</button></div>
              <div className="login-input-wrap"><LockKeyhole size={16} /><input autoComplete="current-password" id="password" onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required type={showPassword ? "text" : "password"} value={password} /><button aria-label={showPassword ? "Hide password" : "Show password"} className="password-visibility" onClick={() => setShowPassword(!showPassword)} type="button">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
              {error && <p className="login-error" role="alert">{error}</p>}
              <button className="button button-primary login-submit" disabled={submitting} type="submit">{submitting ? "Signing in…" : "Continue to workspace"} {!submitting && <ArrowRight size={15} />}</button>
            </form>
            <div className="login-security"><ShieldCheck size={15} /><span>Your session is encrypted and access is scoped to your role.</span></div>
            <div className="login-demo-note">New to Bhoomi? <Link href="/signup">Create an account <ArrowRight size={12} /></Link></div>
            <div className="login-demo-note">Just exploring? <Link href="/">Continue in the sample workspace <ArrowRight size={12} /></Link></div>
          </div>
        </div>
      </section>
      <footer className="login-footer"><span>© 2025 Bhoomi · Land, managed with care.</span><span>Designed for the people who move India forward.</span></footer>
    </main>
  );
}
