import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FolderKanban, ArrowRight, Clock, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";


export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCANNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Scanning & Culling
          </span>
        );
      case "READY_TO_SYNC":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Ready to Sync
          </span>
        );
      case "SYNCING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Syncing to GDrive
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-emerald-400" />
            Event Projects
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Daftar sesi culling foto event & wedding dari Google Drive
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Belum ada project</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Mulai seleksi foto baru dengan memasukkan URL folder Source dan Destination dari Google Drive.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Project Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/projects/${proj.id}`}
              className="group block bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-2xl p-5 transition shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition truncate text-base">
                    {proj.name}
                  </h3>
                  {getStatusBadge(proj.status)}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    {proj.total_photos > 0
                      ? `${proj.processed_photos || 0} / ${proj.total_photos} foto`
                      : "Menunggu indexing"}
                  </span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-300">
                    Mode {proj.sync_mode}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {new Date(proj.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition flex items-center gap-1">
                  Buka Culling
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
