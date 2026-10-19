"use client";

import Link from "next/link";
import { Camera, Sparkles, LogOut, Plus, FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (pathname === "/login") return null;

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/projects" className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-100 flex items-center gap-1.5 tracking-tight">
              AI Photo Culling
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/projects"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                pathname === "/projects"
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5" />
                Projects
              </span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <span className="text-xs text-slate-400 hidden md:inline truncate max-w-[180px]">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
