"use client";

import { X, BookOpen, ShieldCheck, AlertTriangle, Crosshair, Smile, Frame, SunMedium, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function KnowledgeBaseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();

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
                {t("rubrikPageTitle")}
              </h2>
              <p className="text-xs text-slate-400">
                {t("rubrikPageSubtitle")}
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
              <span>{t("autoRejectHeading")}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
              <li>
                <strong className="text-white">{t("rejectNonHumanTitle")}</strong>: {t("rejectNonHumanDesc")}
              </li>
              <li>
                <strong className="text-white">{t("rejectBlurTitle")}</strong>: {t("rejectBlurDesc")}
              </li>
              <li>
                <strong className="text-white">{t("rejectBlinkTitle")}</strong>: {t("rejectBlinkDesc")}
              </li>
            </ul>
          </div>

          {/* 5 Pillars Detail */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t("pillarsSectionHeading")}
            </h3>

            {/* Pilar 1 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  {t("pilarFocus")}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {t("cutoffScore")}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {locale === "id"
                  ? "Ketajaman lensa tepat mengunci di pupil mata subjek utama (tack-sharp)."
                  : "Lens sharpness strictly locked onto the pupil of the main subject's eyes (tack-sharp)."}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-rose-400 font-bold block">1.0 - 5.0</span>
                  {locale === "id" ? "Blur/goyang parah, mata kabur, out-of-focus." : "Fatal blur/shake, hazy eyes, out-of-focus."}
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-amber-400 font-bold block">5.5 - 6.4</span>
                  {locale === "id" ? "Soft focus / slight motion blur (tidak lolos)." : "Soft focus / slight motion blur (~10%, fails culling)."}
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold block">6.5 - 10.0</span>
                  {locale === "id" ? "Fokus tajam mengunci, bulu mata & catchlight detail." : "Tack-sharp eye focus, eyelashes & catchlight detail."}
                </div>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-sky-400" />
                  {t("pilarExpression")}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {locale === "id"
                  ? "Ekspresi wajah alami, mata terbuka penuh (zero blinking), senyum tulus, dan penangkapan puncak emosi."
                  : "Natural facial expressions, eyes fully open (zero blinking), candid smiles, and capturing peak emotion."}
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Frame className="w-4 h-4 text-purple-400" />
                  {t("pilarComposition")}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {locale === "id"
                  ? "Keseimbangan proporsi visual (Rule of Thirds, simetri). Bebas dari potongan frame canggung di persendian tubuh."
                  : "Visual balance (Rule of Thirds, symmetry). Free from awkward joint cuts or unintentional horizon tilts."}
              </p>
            </div>

            {/* Pilar 4 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <SunMedium className="w-4 h-4 text-amber-400" />
                  {t("pilarLighting")}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {locale === "id"
                  ? "Detail gaun pengantin putih tidak blown-out dan jas gelap tidak mati. Pencahayaan wajah flattering."
                  : "Highlight roll-off preserving white dress details and deep dark suit textures. Flattering facial lighting."}
              </p>
            </div>

            {/* Pilar 5 */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  {t("pilarBackground")}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {locale === "id"
                  ? "Bebas dari objek pengganggu di belakang kepala, photobomb kru/tamu tak sengaja, dan pemisahan subjek jelas."
                  : "Clean backgrounds without head distractions, unintentional guest/crew photobombs, and distinct subject separation."}
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
            {t("understoodBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
