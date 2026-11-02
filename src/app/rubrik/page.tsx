import {
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Crosshair,
  Smile,
  Frame,
  SunMedium,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Rubrik Kurasi Fotografi Pro | AI Photo Culling",
  description: "Knowledge base standar kurasi fotografer profesional dan panduan grading Vision AI",
};

export default function RubrikPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
      {/* Header Breadcrumb */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Projects
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Rubrik Standar Kurasi Fotografi Profesional
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Knowledge base dan aturan grading Vision AI untuk seleksi foto event & wedding
            </p>
          </div>
        </div>
      </div>

      {/* Hard Elimination Alert */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Aturan Eliminasi Mutlak (Auto REJECT)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Foto akan langsung diberi status <strong className="text-rose-400">REJECTED</strong> tanpa melihat pilar lainnya jika melanggar salah satu dari 3 kondisi kritis berikut:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-900/80 border border-rose-900/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Bukan Manusia</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Foto tanaman, jalan, pohon, dinding, lantai, atau jepretan tanpa subjek orang langsung dibuang.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-rose-900/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Blur / Fokus &lt; 6.5</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Jika ada motion blur (~10%), miss focus, atau goyang kamera pada mata orang, langsung gugur.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-rose-900/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Mata Merem / Blinking</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Subjek utama berkedip, mata setengah tertutup, atau mulut terbuka canggung saat berbicara/mengunyah.
            </p>
          </div>
        </div>
      </div>

      {/* 5 Pillars In-Depth */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Detail 5 Pilar Penilaian Skor (Skala 0 – 10)
        </h2>

        {/* Pilar 1 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">1. Critical Eye-Focus & Sharpness</h3>
                <p className="text-xs text-slate-400">Ketajaman lensa tepat mengunci di pupil mata subjek utama</p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
              Minimum Lolos: 6.5
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-rose-400 font-bold text-xs mb-1">1.0 – 5.0 (Fatal Blur)</div>
              <p className="text-[11px] text-slate-400">Goyang kamera parah, pupil mata kabur, out-of-focus, atau subjek bergerak cepat.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-amber-400 font-bold text-xs mb-1">5.5 – 6.4 (Soft Focus)</div>
              <p className="text-[11px] text-slate-400">Slight motion blur (~10%) atau fokus jatuh di telinga/baju. Tidak lolos standar culling.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-bold text-xs mb-1">6.5 – 10.0 (Tack-Sharp)</div>
              <p className="text-[11px] text-slate-400">Bulu mata tajam terdefinisi, detail catchlight jelas, subjek terpisah tajam dari background.</p>
            </div>
          </div>
        </div>

        {/* Pilar 2 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">2. Micro-Expressions & Eyes (Zero Blinking)</h3>
              <p className="text-xs text-slate-400">Kewajaran ekspresi wajah dan momen emosional terbaik</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-rose-400 font-bold text-xs mb-1">&lt; 5.0 (Canggung / Merem)</div>
              <p className="text-[11px] text-slate-400">Mata merem/sayu, mulut terbuka aneh saat berbicara/mengunyah, atau ekspresi tidak siap.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-amber-400 font-bold text-xs mb-1">5.0 – 7.0 (Transisi / Datar)</div>
              <p className="text-[11px] text-slate-400">Ekspresi netral/datar, pose agak kaku, atau gestur peralihan sebelum pose siap.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-bold text-xs mb-1">7.5 – 10.0 (Peak Emotion)</div>
              <p className="text-[11px] text-slate-400">Tawa lepas natural, senyum simetris, tatapan intim, puncak momen candid yang berharga.</p>
            </div>
          </div>
        </div>

        {/* Pilar 3 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Frame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">3. Composition & Framing</h3>
              <p className="text-xs text-slate-400">Keseimbangan proporsi visual dan estetika framing</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>• <strong>Poin Positif:</strong> Penerapan Rule of Thirds, Center Symmetry pada pelaminan/grup, Leading Lines yang mengarahkan mata ke subjek, atau Negative Space yang disengaja.</p>
            <p>• <strong>Poin Negatif:</strong> Awkward cropping tepat di persendian tubuh (pergelangan tangan, lutut, leher, dagu terpotong), atau kemiringan garis horizon yang tidak disengaja.</p>
          </div>
        </div>

        {/* Pilar 4 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">4. Lighting & Exposure Integrity</h3>
              <p className="text-xs text-slate-400">Kualitas pencahayaan dan kontrol detail highlight/shadow</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>• <strong>Highlight Roll-off:</strong> Detail gaun pengantin putih tidak blown-out (clipping putih mati) dan tekstur jas gelap tetap terbaca.</p>
            <p>• <strong>Pencahayaan Wajah:</strong> Terdapat catchlight alami di mata, tidak ada bayangan keras di bawah kantung mata (raccoon eyes) atau bayangan flash kasar di tembok belakang.</p>
          </div>
        </div>

        {/* Pilar 5 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">5. Background Hygiene & Separation</h3>
              <p className="text-xs text-slate-400">Kebersihan latar belakang dari elemen pengganggu (distractions)</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>• <strong>Bebas Distraksi:</strong> Tidak ada objek yang seolah tumbuh dari kepala subjek (tiang, lampu, cabang pohon), tidak ada staf/kru dokumentasi atau botol minum yang bocor masuk frame (photobomb).</p>
            <p>• <strong>Subject Separation:</strong> Subjek utama menonjol jelas dari latar belakang (baik via bokeh DoF maupun kontras pencahayaan).</p>
          </div>
        </div>
      </div>

      {/* Decision Summary */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Kategori Keputusan Akhir (Cull Status)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
            <span className="font-bold text-emerald-400 block mb-1">⭐ KEEP_BEST</span>
            <p className="text-[11px] text-slate-400">Pemenang foto terbaik dari satu pose burst. Wajib memenuhi syarat: ada manusia, mata melek, ketajaman ≥ 6.5, dan skor rata-rata ≥ 5.8.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40">
            <span className="font-bold text-amber-400 block mb-1">📷 ALTERNATIVE</span>
            <p className="text-[11px] text-slate-400">Foto cadangan yang layak pakai dan tajam, namun kalah tipis dari pemenang dalam hal angle atau ekspresi.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <span className="font-bold text-rose-400 block mb-1">❌ REJECTED</span>
            <p className="text-[11px] text-slate-400">Foto gagal teknis (blur &lt; 6.5, merem, gelap ekstrem) atau foto bukan subjek manusia.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
