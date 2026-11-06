"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/app/actions/projects";
import { extractFolderId } from "@/lib/drive-url";
import { FolderSync, ArrowLeft, Check, Sparkles, AlertCircle, Copy, Move, Info } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useI18n();

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
      setError("Please enter a project name.");
      return;
    }
    if (!sourceId) {
      setError("Invalid Google Drive Source Folder URL or ID.");
      return;
    }
    if (!destId) {
      setError("Invalid Google Drive Destination Folder URL or ID.");
      return;
    }
    if (sourceId === destId) {
      setError("Source Folder and Destination Folder cannot be the same.");
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
      setError((err as Error)?.message || "An unexpected error occurred.");
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
        {t("backToProjects")}
      </Link>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <FolderSync className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {t("newProjectHeading")}
            </h1>
            <p className="text-xs text-slate-400">
              {t("newProjectSubheading")}
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
              {t("projectNameLabel")}
            </label>
            <input
              type="text"
              required
              placeholder={t("projectNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t("sourceUrlLabel")}
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
              placeholder={t("sourceUrlPlaceholder")}
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              {t("sourceUrlHint")}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t("destUrlLabel")}
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
              placeholder={t("destUrlPlaceholder")}
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              {t("destUrlHint")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              {t("syncModeLabel")}
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
                    <span>{t("copyModeTitle")}</span>
                  </div>
                  {syncMode === "COPY" && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t("copyModeDesc")}
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
                    <span>{t("moveModeTitle")}</span>
                  </div>
                  {syncMode === "MOVE" && (
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t("moveModeDesc")}
                </p>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {t("preflightNotice")}
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
                <span>{t("validatingPipelineBtn")}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t("startPipelineBtn")}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
