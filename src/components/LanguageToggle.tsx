"use client";

import { useI18n } from "@/lib/i18n/context";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs">
      <div className="px-1.5 text-slate-500">
        <Globe className="w-3.5 h-3.5" />
      </div>
      <button
        onClick={() => setLocale("en")}
        className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
          locale === "en"
            ? "bg-slate-800 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("id")}
        className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
          locale === "id"
            ? "bg-slate-800 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        ID
      </button>
    </div>
  );
}
