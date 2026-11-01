"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updatePhotoStatusAction, triggerSyncAction } from "@/app/actions/projects";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LazyImage } from "@/components/LazyImage";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Star,
  RefreshCw,
  FolderSync,
  X,
  Camera,
  Layers,
  ExternalLink,
} from "lucide-react";

export type Project = {
  id: string;
  name: string;
  source_folder_id: string;
  destination_folder_id: string;
  sync_mode: "COPY" | "MOVE";
  status: "IDLE" | "SCANNING" | "READY_TO_SYNC" | "SYNCING" | "COMPLETED" | "FAILED";
  total_photos: number;
  processed_photos: number;
  created_at: string;
};

export type Photo = {
  id: string;
  project_id: string;
  cluster_id: string | null;
  gdrive_file_id: string;
  file_name: string;
  thumbnail_url: string | null;
  captured_at: string | null;
  exif_data: {
    iso?: number;
    aperture?: number;
    shutterSpeed?: number;
    focalLength?: number;
  } | null;
  sharpness_score: number | null;
  is_technically_rejected: boolean;
  reject_reason: string | null;
  ai_scores: {
    focus_sharpness?: number;
    expression?: number;
    composition?: number;
    lighting?: number;
    background_cleanliness?: number;
  } | null;
  overall_score: number;
  eyes_all_open: boolean;
  ai_critique: string | null;
  cull_status: "PENDING" | "KEEP_BEST" | "ALTERNATIVE" | "REJECTED";
  is_synced_to_gdrive: boolean;
};

export function CullingWorkspace({
  initialProject,
  initialPhotos,
}: {
  initialProject: Project;
  initialPhotos: Photo[];
}) {
  const [project, setProject] = useState<Project>(initialProject);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [activeTab, setActiveTab] = useState<"ALL" | "KEEP_BEST" | "ALTERNATIVE" | "REJECTED">("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [columnsCount, setColumnsCount] = useState(3);

  // Responsive column count based on parent container width
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      const width = parentRef.current?.offsetWidth || window.innerWidth;
      if (width < 640) {
        setColumnsCount(1);
      } else if (width < 1024) {
        setColumnsCount(2);
      } else {
        setColumnsCount(3);
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Setup Supabase Realtime for live scanning & culling updates
  useEffect(() => {
    const supabase = createClient();

    const projectChannel = supabase
      .channel(`project-${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${project.id}`,
        },
        (payload) => {
          setProject((prev) => ({ ...prev, ...(payload.new as Project) }));
        }
      )
      .subscribe();

    const photosChannel = supabase
      .channel(`photos-${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photos",
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPhotos((prev) => [payload.new as Photo, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPhotos((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Photo) : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(photosChannel);
    };
  }, [project.id]);

  // Statistics count
  const stats = useMemo(() => {
    const counts = { KEEP_BEST: 0, ALTERNATIVE: 0, REJECTED: 0, PENDING: 0, TECH_REJECT: 0 };
    for (const p of photos) {
      if (p.is_technically_rejected) counts.TECH_REJECT++;
      if (p.cull_status in counts) counts[p.cull_status]++;
    }
    return counts;
  }, [photos]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    if (activeTab === "ALL") return photos;
    return photos.filter((p) => p.cull_status === activeTab);
  }, [photos, activeTab]);

  // Virtualizer setup
  const rows = useMemo(() => {
    const result: Photo[][] = [];
    for (let i = 0; i < filteredPhotos.length; i += columnsCount) {
      result.push(filteredPhotos.slice(i, i + columnsCount));
    }
    return result;
  }, [filteredPhotos, columnsCount]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (columnsCount === 1 ? 460 : 420),
    overscan: 3,
  });

  const handleStatusChange = async (
    photoId: string,
    newStatus: "KEEP_BEST" | "ALTERNATIVE" | "REJECTED",
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    // Optimistic UI update
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, cull_status: newStatus } : p))
    );
    if (selectedPhoto && selectedPhoto.id === photoId) {
      setSelectedPhoto((prev) => (prev ? { ...prev, cull_status: newStatus } : null));
    }
    await updatePhotoStatusAction(photoId, newStatus);
  };

  const handleSync = async () => {
    if (!confirm(`Mulai sinkronisasi ${stats.KEEP_BEST} foto terpilih ke Destination (Mode: ${project.sync_mode})?`)) {
      return;
    }
    try {
      setSyncing(true);
      setSyncError(null);
      const res = await triggerSyncAction(project.id);
      if (res.error) setSyncError(res.error);
    } catch (err: unknown) {
      setSyncError((err as Error)?.message || "Gagal memulai sync");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Header & Status Bar */}
      <div className="border-b border-slate-800 bg-slate-900/40 p-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">{project.name}</h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {project.sync_mode}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>Status: <strong className="text-white">{project.status}</strong></span>
              <span>•</span>
              <a
                href={`https://drive.google.com/drive/folders/${project.destination_folder_id}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                Buka Folder Tujuan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Action Button: Sync */}
          <div className="flex items-center gap-3">
            {project.status === "SCANNING" ? (
              <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 px-3.5 py-2 rounded-xl text-xs font-medium">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Pipeline Sedang Berjalan...</span>
              </div>
            ) : project.status === "SYNCING" ? (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-2 rounded-xl text-xs font-medium">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sinkronisasi ke GDrive...</span>
              </div>
            ) : project.status === "COMPLETED" ? (
              <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 px-3.5 py-2 rounded-xl text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai Disinkronkan</span>
              </div>
            ) : (
              <button
                onClick={handleSync}
                disabled={syncing || stats.KEEP_BEST === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
              >
                <FolderSync className="w-4 h-4" />
                <span>Sync {stats.KEEP_BEST} Foto ke Destination</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Scanning Progress Bar */}
        {project.status === "SCANNING" && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Memproses analisis gambar & kurasi Gemini Vision AI...</span>
              <span className="font-mono text-emerald-400 font-medium">
                {project.processed_photos || 0} / {project.total_photos || 0} foto
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${
                    project.total_photos > 0
                      ? Math.min(100, Math.round(((project.processed_photos || 0) / project.total_photos) * 100))
                      : 10
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {syncError && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}
      </div>

      {/* Tabs & Stats Filter Bar */}
      <div className="border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab("KEEP_BEST")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "KEEP_BEST"
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                : "text-slate-400 hover:text-emerald-400"
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            Keep Best ({stats.KEEP_BEST})
          </button>
          <button
            onClick={() => setActiveTab("ALTERNATIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ALTERNATIVE"
                ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                : "text-slate-400 hover:text-amber-400"
            }`}
          >
            Alternative ({stats.ALTERNATIVE})
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "REJECTED"
                ? "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                : "text-slate-400 hover:text-rose-400"
            }`}
          >
            Rejected ({stats.REJECTED})
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          Klik foto untuk detail 5 pilar & critique AI
        </div>
      </div>

      {/* Virtualized Photos Grid */}
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        {filteredPhotos.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Camera className="w-8 h-8 mb-2 opacity-50" />
            <span>Tidak ada foto di kategori ini.</span>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowPhotos = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`grid gap-4 pb-4 ${
                    columnsCount === 1
                      ? "grid-cols-1"
                      : columnsCount === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                  }`}
                >
                  {rowPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className={`group relative bg-slate-900 border rounded-xl overflow-hidden cursor-pointer transition flex flex-col justify-between ${
                        photo.cull_status === "KEEP_BEST"
                          ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
                          : photo.cull_status === "REJECTED"
                          ? "border-rose-900/60 opacity-60 hover:opacity-100"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-3/4 max-h-[420px] bg-slate-950 overflow-hidden flex items-center justify-center">
                        <LazyImage
                          src={`/api/photos/${photo.id}/thumbnail`}
                          alt={photo.file_name}
                          className="w-full h-full object-contain group-hover:scale-102 transition duration-300"
                        />

                        {/* Status Badge */}
                        <div className="absolute top-2.5 left-2.5">
                          {photo.cull_status === "KEEP_BEST" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500 text-slate-950 shadow-md">
                              <Star className="w-3 h-3 fill-current" />
                              KEEP BEST
                            </span>
                          )}
                          {photo.cull_status === "ALTERNATIVE" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500 text-slate-950 shadow-md">
                              ALTERNATIVE
                            </span>
                          )}
                          {photo.cull_status === "REJECTED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-600 text-white shadow-md">
                              REJECTED
                            </span>
                          )}
                        </div>

                        {/* Overall Score Badge */}
                        {photo.overall_score > 0 && (
                          <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-mono font-bold text-white border border-slate-700">
                            {photo.overall_score.toFixed(1)}/10
                          </div>
                        )}

                        {/* Blinking / Closed Eyes Alert */}
                        {!photo.eyes_all_open && (
                          <div className="absolute bottom-2.5 left-2.5 bg-rose-950/90 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                            <EyeOff className="w-3 h-3 text-rose-400" />
                            <span>Blink / Merem</span>
                          </div>
                        )}

                        {photo.is_technically_rejected && (
                          <div className="absolute bottom-2.5 right-2.5 bg-rose-950/90 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded text-[10px]">
                            {photo.reject_reason || "Gagal Teknis"}
                          </div>
                        )}
                      </div>

                      {/* Card Bottom: File Info & Quick Actions */}
                      <div className="p-3 bg-slate-900 flex items-center justify-between gap-2 border-t border-slate-800/80 text-xs">
                        <div className="truncate text-slate-300 text-[11px] font-medium" title={photo.file_name}>
                          {photo.file_name}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            title="Set to Keep Best"
                            onClick={(e) => handleStatusChange(photo.id, "KEEP_BEST", e)}
                            className={`p-1.5 rounded transition ${
                              photo.cull_status === "KEEP_BEST"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "text-slate-500 hover:text-emerald-400 hover:bg-slate-800"
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Set to Alternative"
                            onClick={(e) => handleStatusChange(photo.id, "ALTERNATIVE", e)}
                            className={`p-1.5 rounded transition ${
                              photo.cull_status === "ALTERNATIVE"
                                ? "bg-amber-500/20 text-amber-400"
                                : "text-slate-500 hover:text-amber-400 hover:bg-slate-800"
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Set to Rejected"
                            onClick={(e) => handleStatusChange(photo.id, "REJECTED", e)}
                            className={`p-1.5 rounded transition ${
                              photo.cull_status === "REJECTED"
                                ? "bg-rose-500/20 text-rose-400"
                                : "text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
            {/* Modal Image Area */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
              {selectedPhoto.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/photos/${selectedPhoto.id}/thumbnail`}
                  alt={selectedPhoto.file_name}
                  className="max-h-[60vh] md:max-h-[85vh] w-auto object-contain"
                />
              ) : (
                <span className="text-slate-600">No Image Preview</span>
              )}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-white md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details Sidebar */}
            <div className="w-full md:w-96 p-6 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-slate-800">
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-sm truncate max-w-[220px]" title={selectedPhoto.file_name}>
                      {selectedPhoto.file_name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedPhoto.captured_at
                        ? new Date(selectedPhoto.captured_at).toLocaleString("id-ID")
                        : "Waktu tidak ada"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white transition hidden md:block"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Score Breakdown (5 Pilar Fotografi Profesional) */}
                <div className="space-y-3 mb-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    5 Pilar Kurasi Profesional
                  </div>
                  {selectedPhoto.ai_scores ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>1. Eye Focus & Sharpness:</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {selectedPhoto.ai_scores.focus_sharpness ?? "-"}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>2. Micro-Expression & Eyes:</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {selectedPhoto.ai_scores.expression ?? "-"}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>3. Composition & Framing:</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {selectedPhoto.ai_scores.composition ?? "-"}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>4. Lighting & Exposure:</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {selectedPhoto.ai_scores.lighting ?? "-"}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>5. Background Hygiene:</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {selectedPhoto.ai_scores.background_cleanliness ?? "-"}/10
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Belum dianalisis oleh AI.</p>
                  )}
                </div>

                {/* AI Critique */}
                {selectedPhoto.ai_critique && (
                  <div className="mb-6 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3" />
                      Critique Fotografer AI
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedPhoto.ai_critique}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">
                  Ubah Keputusan Kurasi:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedPhoto.id, "KEEP_BEST")}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedPhoto.cull_status === "KEEP_BEST"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Keep Best
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedPhoto.id, "ALTERNATIVE")}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedPhoto.cull_status === "ALTERNATIVE"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Alternative
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedPhoto.id, "REJECTED")}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedPhoto.cull_status === "REJECTED"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
