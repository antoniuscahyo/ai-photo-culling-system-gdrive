"use client";

import { X, BookOpen, ShieldCheck, AlertTriangle, CheckCircle, Crosshair, Smile, Frame, SunMedium, Sparkles } from "lucide-react";

export function KnowledgeBaseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Rubrik Standar Kurasi Fotografi Pro
              </h2>
              <p className="text-xs text-slate-400">
                Panduan penilaian Vision AI & arti skor 0–10 pada tiap foto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto text-xs text-slate-300">
          {/* Hard Gates Summary */}
          <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Aturan Eliminasi Mutlak (Auto REJECT)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
              <li><strong className="text-white">Bukan Manusia</strong>: Foto tanaman, jalan, pohon, dinding, atau jepretan tanpa subjek orang langsung dibuang.</li>
              <li><strong className="text-white">Fokus & Ketajaman &lt; 6.5</strong>: Jika ada motion blur (~10%), miss focus, atau goyang kamera pada mata orang, langsung gugur.</li>
              <li><strong className="text-white">Mata Merem / Berkedip</strong>: Subjek utama berkedip atau ekspresi mulut canggung saat berbicara/mengunyah.</li>
            </ul>
          </div>

          {/* 5 Pillars Detail */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Detail 5 Pilar Penilaian Skor (0 - 10)
            </h3>

            {/* Pilar 1 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  1. Eye Focus & Sharpness
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Cutoff: ≥ 6.5
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Ketajaman lensa tepat mengunci di pupil mata subjek utama (tack-sharp).
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-rose-400 font-bold block">1.0 - 5.0</span>
                  Blur/goyang parah, mata kabur, out-of-focus.
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-amber-400 font-bold block">5.5 - 6.4</span>
                  Soft focus / slight motion blur (tidak lolos culling).
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold block">6.5 - 10.0</span>
                  Fokus tajam mengunci, bulu mata & catchlight detail.
                </div>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-sky-400" />
                  2. Micro-Expression & Eyes
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Ekspresi wajah alami, mata terbuka penuh (zero blinking), senyum tulus, dan penangkapan puncak emosi (peak emotion / candid moment).
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-rose-400 font-bold block">&lt; 5.0</span>
                  Merem, mata sayu, mulut terbuka aneh saat bicara.
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-amber-400 font-bold block">5.0 - 7.0</span>
                  Ekspresi datar, pose kaku, momen transisi.
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold block">7.5 - 10.0</span>
                  Tawa lepas natural, tatapan intim, senyum terbaik.
                </div>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Frame className="w-4 h-4 text-purple-400" />
                  3. Composition & Framing
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Keseimbangan proporsi visual (Rule of Thirds, garis simetri, leading lines). Bebas dari potongan frame canggung di persendian tangan/kaki atau garis horizon yang miring tak disengaja.
              </p>
            </div>

            {/* Pilar 4 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <SunMedium className="w-4 h-4 text-amber-400" />
                  4. Lighting & Exposure Integrity
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Kontrol kontras: detail gaun putih tidak blown-out (highlight clipping) dan jas gelap tidak mati. Jatuhnya cahaya di wajah merata tanpa bayangan keras (raccoon eyes).
              </p>
            </div>

            {/* Pilar 5 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  5. Background Hygiene & Separation
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Kebersihan latar belakang: tidak ada objek asing yang "tumbuh" dari kepala subjek (tiang, pohon), bebas photobomb kru/tamu tak sengaja, dan pemisahan subjek dari background jelas.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
