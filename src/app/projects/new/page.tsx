"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/app/actions/projects";
import { extractFolderId } from "@/lib/drive-url";
import { FolderSync, ArrowLeft, Check, Sparkles, AlertCircle, Copy, Move, Info } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [syncMode, setSyncMode] = useState<"COPY" | "MOVE">("COPY");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceId = extractFolderId(sourceUrl);
  const destId = extractFolderId(destinationUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Silakan masukkan nama acara/proyek.");
      return;
    }
    if (!sourceId) {
      setError("URL atau ID Google Drive Source Folder tidak valid.");
      return;
    }
    if (!destId) {
      setError("URL atau ID Google Drive Destination Folder tidak valid.");
      return;
    }
    if (sourceId === destId) {
      setError("Folder Source dan Folder Destination tidak boleh sama.");
      return;
    }

    try {
      setLoading(true);
      const res = await createProjectAction({
        name,
        sourceUrl,
        destinationUrl,
        syncMode,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else if (res.projectId) {
        router.push(`/projects/${res.projectId}`);
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Terjadi kesalahan saat memproses proyek.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Daftar Projects
      </Link>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <FolderSync className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Mulai Culling Project Baru
            </h1>
            <p className="text-xs text-slate-400">
              Hubungkan folder Google Drive foto mentahan & folder hasil kurasi
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Project / Event Name
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Wedding Andi & Rina"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Source Folder Link (Foto Mentah)
              </label>
              {sourceId && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  ID: {sourceId.slice(0, 12)}...
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="https://drive.google.com/drive/folders/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              URL folder Google Drive tempat foto mentahan (raw/jpeg) berada.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Destination Folder Link (Hasil Seleksi)
              </label>
              {destId && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  ID: {destId.slice(0, 12)}...
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="https://drive.google.com/drive/folders/..."
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Folder tujuan di Google Drive. Semua foto lolos seleksi akan disinkronkan secara flat ke 1 folder ini.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Sync Action Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSyncMode("COPY")}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  syncMode === "COPY"
                    ? "bg-emerald-500/10 border-emerald-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Copy className="w-4 h-4 text-emerald-400" />
                    <span>COPY (Default)</span>
                  </div>
                  {syncMode === "COPY" && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Menyalin foto terpilih ke folder Destination. File asli di folder Source tetap utuh dan aman.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSyncMode("MOVE")}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  syncMode === "MOVE"
                    ? "bg-amber-500/10 border-amber-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Move className="w-4 h-4 text-amber-400" />
                    <span>MOVE</span>
                  </div>
                  {syncMode === "MOVE" && (
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Memindahkan file asli langsung ke Destination. Menghemat kuota penyimpanan Google Drive.
                </p>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Sistem akan melakukan <strong>pre-flight check</strong> untuk memverifikasi akun Google Anda memiliki hak akses baca di Source dan hak akses tambah file di Destination.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memvalidasi & Memulai Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mulai AI Culling Pipeline</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
