"use client";

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
import { useI18n } from "@/lib/i18n/context";

export function RubrikClient() {
  const { t, locale } = useI18n();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
      {/* Header Breadcrumb */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("backToProjects")}
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t("rubrikPageTitle")}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {t("rubrikPageSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Hard Elimination Alert */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t("autoRejectHeading")}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {t("autoRejectDesc")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-900/80 border border-rose-900/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{t("rejectNonHumanTitle")}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t("rejectNonHumanDesc")}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-rose-900/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{t("rejectBlurTitle")}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t("rejectBlurDesc")}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-rose-900/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{t("rejectBlinkTitle")}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t("rejectBlinkDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* 5 Pillars In-Depth */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {t("pillarsSectionHeading")}
        </h2>

        {/* Pilar 1 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">{t("pilarFocus")}</h3>
                <p className="text-xs text-slate-400">
                  {locale === "id"
                    ? "Ketajaman lensa tepat mengunci di pupil mata subjek utama"
                    : "Lens sharpness strictly locked onto the pupil of the main subject's eyes"}
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
              {t("cutoffScore")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-rose-400 font-bold text-xs mb-1">1.0 – 5.0 ({locale === "id" ? "Fatal Blur" : "Fatal Blur"})</div>
              <p className="text-[11px] text-slate-400">
                {locale === "id"
                  ? "Goyang kamera parah, pupil mata kabur, out-of-focus, atau subjek bergerak cepat."
                  : "Severe camera shake, blurry pupils, out-of-focus, or rapid subject motion."}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-amber-400 font-bold text-xs mb-1">5.5 – 6.4 ({locale === "id" ? "Soft Focus" : "Soft Focus"})</div>
              <p className="text-[11px] text-slate-400">
                {locale === "id"
                  ? "Slight motion blur (~10%) atau fokus jatuh di telinga/baju. Tidak lolos standar culling."
                  : "Slight motion blur (~10%) or focus missed to ears/clothing. Disqualified from keepers."}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-bold text-xs mb-1">6.5 – 10.0 ({locale === "id" ? "Tack-Sharp" : "Tack-Sharp"})</div>
              <p className="text-[11px] text-slate-400">
                {locale === "id"
                  ? "Bulu mata tajam terdefinisi, detail catchlight jelas, subjek terpisah tajam dari background."
                  : "Tack-sharp eyelashes, crisp catchlights, subject clearly separated from background."}
              </p>
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
              <h3 className="font-semibold text-white text-sm">{t("pilarExpression")}</h3>
              <p className="text-xs text-slate-400">
                {locale === "id"
                  ? "Kewajaran ekspresi wajah dan momen emosional terbaik"
                  : "Natural facial expressions and peak emotional candid moments"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-rose-400 font-bold text-xs mb-1">&lt; 5.0 ({locale === "id" ? "Canggung / Merem" : "Awkward / Blink"})</div>
              <p className="text-[11px] text-slate-400">
                {locale === "id"
                  ? "Mata merem/sayu, mulut terbuka aneh saat berbicara/mengunyah, atau ekspresi tidak siap."
                  : "Blinking, sleepy eyes, awkward open mouths while speaking/chewing, or unready candid faces."}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-amber-400 font-bold text-xs mb-1">5.0 – 7.0 ({locale === "id" ? "Transisi / Datar" : "Neutral / Transition"})</div>
              <p className="text-[11px] text-slate-400">
                {locale === "id"
                  ? "Ekspresi netral/datar, pose agak kaku, atau gestur peralihan sebelum pose siap."
                  : "Neutral expression, stiff posture, or transitional gesture before settling into a pose."}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-bold text-xs mb-1">7.5 – 10.0 ({locale === "id" ? "Peak Emotion" : "Peak Emotion"})</div>
              <p className="text-[11px] text-slate-400">
                {locale === "id"
                  ? "Tawa lepas natural, senyum simetris, tatapan intim, puncak momen candid yang berharga."
                  : "Natural laughter, genuine smiles, intimate gazes, or emotionally poignant moments."}
              </p>
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
              <h3 className="font-semibold text-white text-sm">{t("pilarComposition")}</h3>
              <p className="text-xs text-slate-400">
                {locale === "id"
                  ? "Keseimbangan proporsi visual dan estetika framing"
                  : "Visual balance, rule of thirds, and framing aesthetics"}
              </p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>
              • <strong>{locale === "id" ? "Poin Positif:" : "Positive Traits:"}</strong>{" "}
              {locale === "id"
                ? "Penerapan Rule of Thirds, Center Symmetry pada pelaminan/grup, Leading Lines, atau Negative Space yang disengaja."
                : "Rule of Thirds, Center Symmetry for stage groups, Leading Lines, or deliberate artistic Negative Space."}
            </p>
            <p>
              • <strong>{locale === "id" ? "Poin Negatif:" : "Negative Traits:"}</strong>{" "}
              {locale === "id"
                ? "Awkward cropping tepat di persendian tubuh (pergelangan tangan, lutut, leher terpotong), atau kemiringan horizon tak disengaja."
                : "Awkward joint cropping (cutting at wrists, knees, neck, chin) or unintentional Dutch angle horizon tilts."}
            </p>
          </div>
        </div>

        {/* Pilar 4 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{t("pilarLighting")}</h3>
              <p className="text-xs text-slate-400">
                {locale === "id"
                  ? "Kualitas pencahayaan dan kontrol detail highlight/shadow"
                  : "Lighting quality and highlight/shadow roll-off control"}
              </p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>
              • <strong>Highlight Roll-off:</strong>{" "}
              {locale === "id"
                ? "Detail gaun pengantin putih tidak blown-out (clipping putih mati) dan tekstur jas gelap tetap terbaca."
                : "White dress details preserved without blown highlights; deep dark suit textures clearly readable."}
            </p>
            <p>
              • <strong>{locale === "id" ? "Pencahayaan Wajah:" : "Facial Illumination:"}</strong>{" "}
              {locale === "id"
                ? "Catchlight alami di mata tanpa bayangan keras di bawah mata (raccoon eyes) atau bayangan flash kasar di tembok."
                : "Natural eye catchlights without harsh under-eye raccoon shadows or harsh direct flash wall shadows."}
            </p>
          </div>
        </div>

        {/* Pilar 5 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{t("pilarBackground")}</h3>
              <p className="text-xs text-slate-400">
                {locale === "id"
                  ? "Kebersihan latar belakang dari elemen pengganggu (distractions)"
                  : "Background cleanliness and visual distraction hygiene"}
              </p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>
              • <strong>{locale === "id" ? "Bebas Distraksi:" : "Clean Separation:"}</strong>{" "}
              {locale === "id"
                ? "Tidak ada tiang/pohon yang tumbuh dari kepala subjek, tidak ada botol minum atau kru yang bocor masuk frame."
                : "No light poles or tree branches sprouting from heads, no rogue crew/beverage bottles cluttering the frame."}
            </p>
          </div>
        </div>
      </div>

      {/* Decision Summary */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {locale === "id" ? "Kategori Keputusan Akhir (Cull Status)" : "Final Decision Categories (Cull Status)"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
            <span className="font-bold text-emerald-400 block mb-1">⭐ KEEP_BEST</span>
            <p className="text-[11px] text-slate-400">
              {locale === "id"
                ? "Pemenang foto terbaik dari satu pose burst. Wajib ada orang, mata terbuka, ketajaman ≥ 6.5, dan skor ≥ 5.8."
                : "Top winning photo from a burst cluster. Requires human subject, open eyes, sharpness ≥ 6.5, and score ≥ 5.8."}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40">
            <span className="font-bold text-amber-400 block mb-1">📷 ALTERNATIVE</span>
            <p className="text-[11px] text-slate-400">
              {locale === "id"
                ? "Foto cadangan yang tajam dan layak pakai, namun kalah sedikit dari pemenang dalam hal angle atau ekspresi."
                : "Sharp, keeper-worthy backup shot that narrowly missed the top spot due to minor angle or expression nuances."}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <span className="font-bold text-rose-400 block mb-1">❌ REJECTED</span>
            <p className="text-[11px] text-slate-400">
              {locale === "id"
                ? "Foto gagal teknis (blur < 6.5, merem, gelap ekstrem) atau foto bukan subjek manusia."
                : "Technical failures (motion blur < 6.5, blinking, extreme clipping) or non-human captures."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
