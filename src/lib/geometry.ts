import sharp from "sharp";

/**
 * Melakukan auto-straighten & transform pada image buffer berdasarkan rotasi derajat.
 * Menghitung inner bounding box yang aman agar tidak ada border hitam (letterbox) hasil rotasi.
 */
export async function autoStraightenImage(
  imageBuffer: Buffer,
  angleDeg: number
): Promise<Buffer> {
  // Jika kemiringan sangat kecil (< 0.2 derajat), tidak perlu diputar untuk menjaga ketajaman asli
  if (Math.abs(angleDeg) < 0.2) {
    return imageBuffer;
  }

  // Batasi koreksi agar tidak memotong foto secara ekstrem (maksimal +/- 15 derajat)
  const clampedAngle = Math.max(-15, Math.min(15, angleDeg));

  const image = sharp(imageBuffer).rotate();
  const meta = await image.metadata();
  const width = meta.width || 1000;
  const height = meta.height || 1000;

  // Rumus crop dalam (inner crop) agar bebas dari border hitam segitiga hasil rotasi
  const rad = Math.abs((clampedAngle * Math.PI) / 180);
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);

  // Perhitungan dimensi crop maksimal yang muat di dalam persegi hasil rotasi
  // Untuk rotasi kecil: rasio crop = 1 / (cos + (w/h atau h/w)*sin)
  const cropW = Math.floor(width / (cos + (height / width) * sin));
  const cropH = Math.floor(height / (cos + (width / height) * sin));

  // Pastikan cropW dan cropH valid
  const safeW = Math.min(width, Math.max(100, cropW));
  const safeH = Math.min(height, Math.max(100, cropH));

  const left = Math.max(0, Math.floor((width - safeW) / 2));
  const top = Math.max(0, Math.floor((height - safeH) / 2));

  // Putar foto sesuai sudut koreksi, lalu crop bagian tengahnya
  return sharp(imageBuffer)
    .rotate(clampedAngle, { background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .extract({
      left,
      top,
      width: safeW,
      height: safeH,
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}
