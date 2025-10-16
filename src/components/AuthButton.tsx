"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);
      } else {
        setCredits(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const fetchCredits = async (supabaseId: string) => {
    try {
      const response = await fetch(`/api/auth/credits?supabaseId=${supabaseId}`);
      const data = await response.json();
      setCredits(data.credits ?? 0);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-2xl bg-slate-800" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-2xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-slate-100"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {credits !== null && (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/40 px-4 py-2">
          <span className="text-sm font-medium text-slate-400">Credits:</span>
          <span className="text-sm font-semibold text-sky-400">{credits}</span>
        </div>
      )}
      <Link
        href="/dashboard"
        className="rounded-2xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-slate-100"
      >
        Dashboard
      </Link>
      <button
        onClick={handleLogout}
        className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
      >
        Logout
      </button>
    </div>
  );
}
