import OpenAI from "openai";
import { z } from "zod";

export const MODEL = process.env.VISION_MODEL || "antigravity-combo";

export const PhotoVerdict = z.object({
  index: z.number().int(),
  has_human_subject: z.boolean(),
  focus_sharpness: z.number().min(0).max(10),
  expression: z.number().min(0).max(10),
  composition: z.number().min(0).max(10),
  lighting: z.number().min(0).max(10),
  background_cleanliness: z.number().min(0).max(10),
  eyes_all_open: z.boolean(),
  straighten_angle_deg: z.number().default(0), // Derajat rotasi perbaikan horizon (-15 s/d +15, 0 jika sudah lurus)
  status: z.enum(["KEEP_BEST", "ALTERNATIVE", "REJECTED"]),
  critique: z.string(),
});
export const ClusterVerdict = z.object({ photos: z.array(PhotoVerdict) });
export type ClusterVerdictT = z.infer<typeof ClusterVerdict>;

export const SYSTEM_PROMPT = `Kamu adalah photo editor profesional untuk event & wedding photography. Kamu menerima N foto dari SATU rangkaian jepretan (burst/pose sama), diberi index 0..N-1.

TUGAS UTAMA: Mengurasi foto dengan fokus pada SUBJEK MANUSIA / ORANG dan menganalisis GEOMETRI / KEMIRINGAN HORIZON.

ATURAN REJECT MUTLAK (Status = REJECTED):
1. KETAJAMAN & BLUR (focus_sharpness < 6.5): JIKA SUBJEK / WAJAH / MATA MENGALAMI BLUR (termasuk slight motion blur ~10%, camera shake, atau miss-focus), NILAI focus_sharpness HARUS DI BAWAH 6.5 DAN LANGSUNG STATUS = REJECTED. Fokus wajib tack-sharp di mata/wajah subjek utama.
2. TIDAK ADA SUBJEK MANUSIA (has_human_subject = false): Foto tanaman, lantai, dinding, langit, pohon, atau benda mati yang bukan dekorasi/detail resmi acara LANGSUNG REJECT.
3. MATA MEREM / BLINKING pada subjek utama (eyes_all_open = false).
4. GAGAL TEKNIS: Gelap/terang berlebihan atau komposisi terpotong fatal.

5 PILAR PENILAIAN FOTOGRAFI PROFESIONAL:
1. Critical eye-focus & sharpness (0-10): Fokus tajam mengunci di mata orang.
2. Micro-expressions & eyes (0-10): Senyum natural, mata terbuka, tidak sedang mengunyah/canggung.
3. Composition & framing (0-10): Keseimbangan visual, tidak ada cropping canggung di sendi/leher.
4. Lighting & exposure (0-10): Detail wajah dan pakaian terjaga, tidak clipping.
5. Background hygiene (0-10): Bersih dari gangguan visual dan photobomb.

ANALISIS TRANSFORM & GEOMETRY (straighten_angle_deg):
- Periksa garis horizon, garis lantai, dinding, atau panggung.
- Jika foto miring ke kanan, berikan derajat koreksi putar ke kiri (nilai negatif, misal: -2.5).
- Jika foto miring ke kiri, berikan derajat koreksi putar ke kanan (nilai positif, misal: +3.0).
- Jika foto sudah tegak/lurus, berikan 0.0. Nilai antara -15.0 s/d 15.0.

ATURAN KEPUTUSAN (STATUS):
- KEEP_BEST: Maksimal 1 foto terbaik dalam satu grup, DENGAN SYARAT: has_human_subject = true, eyes_all_open = true, dan rata-rata skor >= 5.5.
- JIKA SEMUA FOTO DALAM GRUP ADALAH SAMPAH / TIDAK ADA ORANG / GAGAL TEKNIS: Beri SEMUA status REJECTED (tidak wajib ada pemenang jika kualitas tidak layak).
- ALTERNATIVE: Foto yang bagus dan layak pakai tapi kalah sedikit dibanding pemenang.
- REJECTED: Foto gagal, merem, blur, atau tanpa orang.

Output HARUS berupa JSON murni:
{
  "photos": [
    {
      "index": 0,
      "has_human_subject": true,
      "focus_sharpness": 8.5,
      "expression": 9.0,
      "composition": 8.0,
      "lighting": 8.5,
      "background_cleanliness": 9.0,
      "eyes_all_open": true,
      "straighten_angle_deg": -1.5,
      "status": "KEEP_BEST",
      "critique": "Fokus mata sangat tajam dan ekspresi senyum natural."
    }
  ]
}`;

/** Quality Gate & Conditional Zero-Drop */
export function enforceQualityGate(v: ClusterVerdictT): ClusterVerdictT {
  const overall = (p: z.infer<typeof PhotoVerdict>) =>
    (p.focus_sharpness + p.expression + p.composition + p.lighting + p.background_cleanliness) / 5;

  return {
    photos: v.photos.map((p) => {
      const score = overall(p);
      const isBlurry = (p.focus_sharpness ?? 0) < 6.5;
      if (!p.has_human_subject || !p.eyes_all_open || isBlurry || score < 5.8) {
        return {
          ...p,
          status: "REJECTED" as const,
        };
      }
      return p;
    }),
  };
}

export async function cullCluster(images: Buffer[]): Promise<ClusterVerdictT> {
  const baseURL = process.env.AI_BASE_URL || "http://31.97.222.136:20129/v1";
  const apiKey = process.env.AI_API_KEY || process.env.ANTIGRAVITY_API_KEY || "dummy";

  const client = new OpenAI({ baseURL, apiKey });

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `${SYSTEM_PROMPT}\n\nBerikut ${images.length} foto untuk dibandingkan berdampingan:`,
    },
  ];

  images.forEach((buf, i) => {
    content.push({
      type: "text",
      text: `--- Foto Index ${i} ---`,
    });
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${buf.toString("base64")}`,
        detail: "high",
      },
    });
  });

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "{}";
  const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleanJson);

  return enforceQualityGate(ClusterVerdict.parse(parsed));
}
