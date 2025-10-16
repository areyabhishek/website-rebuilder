"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // Create user record in database with 2 free credits
        try {
          await fetch("/api/auth/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supabaseId: data.user.id,
              email: data.user.email,
            }),
          });
        } catch (dbError) {
          console.error("Failed to create user record:", dbError);
          // Continue anyway - user can still login
        }

        // Show success message
        alert("Account created! Please check your email to verify your account.");
        router.push("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6">
          <Link href="/" className="text-lg font-semibold tracking-tight hover:text-sky-400 transition">
            Portfolio Site Rebuilder
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-16">
        <div className="grid gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-slate-400">
            Start with 2 free site generations
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.35)]"
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg text-slate-100 shadow-inner shadow-black/30 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg text-slate-100 shadow-inner shadow-black/30 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
                placeholder="••••••••"
              />
              <p className="text-xs text-slate-500">Minimum 6 characters</p>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-900/20 border border-rose-700/30 p-4">
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          )}

          <div className="rounded-2xl bg-emerald-900/20 border border-emerald-700/30 p-4">
            <p className="text-sm text-emerald-200">
              <strong>Free credits:</strong> Get 2 free site generations when you sign up!
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <div className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium transition">
              Login
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
