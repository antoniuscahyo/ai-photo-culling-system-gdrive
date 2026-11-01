"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, ImageOff } from "lucide-react";

export function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
}: {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use IntersectionObserver to only load when approaching viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" } // Pre-load 250px before entering screen
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden ${containerClassName}`}
    >
      {/* Placeholder shimmer / spinner while not yet visible or loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center text-slate-700">
          <Camera className="w-6 h-6 opacity-30" />
        </div>
      )}

      {hasError ? (
        <div className="flex flex-col items-center justify-center text-slate-600 text-[11px] gap-1 p-2">
          <ImageOff className="w-5 h-5 text-slate-600" />
          <span>Gagal memuat</span>
        </div>
      ) : isVisible ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}
