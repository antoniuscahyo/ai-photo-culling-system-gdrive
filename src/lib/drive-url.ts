const PATTERNS = [
  /\/folders\/([a-zA-Z0-9_-]{10,})/,
  /[?&]id=([a-zA-Z0-9_-]{10,})/,
];

export function extractFolderId(input: string): string | null {
  const s = input.trim();
  for (const re of PATTERNS) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return /^[a-zA-Z0-9_-]{10,}$/.test(s) ? s : null;
}

/** Thumbnail Drive default =s220; naikkan ke ukuran analisis (PRD Fase 1). */
export function resizeThumbnail(url: string, size = 1024): string {
  return /=s\d+(-[a-z0-9-]+)?$/i.test(url) ? url.replace(/=s\d+(-[a-z0-9-]+)?$/i, `=s${size}`) : `${url}=s${size}`;
}
