import sharp from "sharp";

export type TechnicalResult = {
  rejected: boolean;
  reason: "TOO_DARK" | "OVEREXPOSED" | "GLOBAL_BLUR" | null;
  sharpness: number;
  meanLuma: number;
};

const GRAY_SIZE = 512;

/** 64-bit dHash (9x8 grayscale, bandingkan pixel bersebelahan) sebagai 16 char hex. */
export async function dHash(buf: Buffer): Promise<string> {
  const { data } = await sharp(buf).rotate().grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let bits = "";
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) bits += data[y * 9 + x] > data[y * 9 + x + 1] ? "1" : "0";
  return BigInt("0b" + bits).toString(16).padStart(16, "0");
}

export function hamming(a: string, b: string): number {
  let x = BigInt("0x" + a) ^ BigInt("0x" + b);
  let n = 0;
  while (x) { n += Number(x & BigInt(1)); x >>= BigInt(1); }
  return n;
}

/** Variance of Laplacian pada grayscale ter-resize. Makin kecil = makin blur. */
export function laplacianVariance(gray: Uint8Array, w: number, h: number): number {
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      sum += v; sumSq += v * v; n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

export const THRESHOLDS = {
  darkMean: 25,        // mean luma < 25 -> hampir hitam
  brightMean: 235,     // mean luma > 235 -> overexposed ekstrem
  clipFraction: 0.6,   // >60% piksel clipping hitam/putih
  blurVariance: 20,    // Laplacian variance < 20 -> camera shake global (perlu kalibrasi dgn sampel nyata)
};

export async function technicalFilter(buf: Buffer): Promise<TechnicalResult> {
  const { data, info } = await sharp(buf).rotate()
    .grayscale()
    .resize(GRAY_SIZE, GRAY_SIZE, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let total = 0, dark = 0, bright = 0;
  for (let i = 0; i < data.length; i++) {
    total += data[i];
    if (data[i] <= 8) dark++;
    else if (data[i] >= 247) bright++;
  }
  const meanLuma = total / data.length;
  const sharpness = laplacianVariance(data, info.width, info.height);
  const t = THRESHOLDS;
  let reason: TechnicalResult["reason"] = null;
  if (meanLuma < t.darkMean || dark / data.length > t.clipFraction) reason = "TOO_DARK";
  else if (meanLuma > t.brightMean || bright / data.length > t.clipFraction) reason = "OVEREXPOSED";
  else if (sharpness < t.blurVariance) reason = "GLOBAL_BLUR";
  return { rejected: reason !== null, reason, sharpness, meanLuma };
}

export type ClusterInput = { id: string; capturedAt: Date | null; dhash: string };

/** PRD Fase 2: selisih waktu < 4 detik DAN hamming dHash < 10 -> satu cluster. Input harus sudah diurutkan by capturedAt. */
export function clusterPhotos(photos: ClusterInput[], maxSeconds = 4, maxHamming = 10): string[][] {
  const clusters: string[][] = [];
  let current: ClusterInput[] = [];
  for (const p of photos) {
    const prev = current[current.length - 1];
    const close =
      prev &&
      prev.capturedAt && p.capturedAt &&
      Math.abs(p.capturedAt.getTime() - prev.capturedAt.getTime()) < maxSeconds * 1000 &&
      hamming(prev.dhash, p.dhash) < maxHamming;
    if (!prev || close) current.push(p);
    else { clusters.push(current.map((c) => c.id)); current = [p]; }
  }
  if (current.length) clusters.push(current.map((c) => c.id));
  return clusters;
}
