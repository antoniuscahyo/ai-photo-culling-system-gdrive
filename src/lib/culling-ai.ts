import OpenAI from "openai";
import { z } from "zod";

export const MODEL = process.env.VISION_MODEL || "antigravity-combo";

export const PhotoVerdict = z.object({
  index: z.number().int(),
  focus_sharpness: z.number().min(0).max(10),
  expression: z.number().min(0).max(10),
  composition: z.number().min(0).max(10),
  lighting: z.number().min(0).max(10),
  background_cleanliness: z.number().min(0).max(10),
  eyes_all_open: z.boolean(),
  status: z.enum(["KEEP_BEST", "ALTERNATIVE", "REJECTED"]),
  critique: z.string(),
});
export const ClusterVerdict = z.object({ photos: z.array(PhotoVerdict) });
export type ClusterVerdictT = z.infer<typeof ClusterVerdict>;

export const SYSTEM_PROMPT = `Kamu adalah photo editor profesional untuk event & wedding. Kamu menerima N foto dari SATU rangkaian jepretan (burst/pose sama), diberi index 0..N-1.
Bandingkan berdampingan menggunakan 5 pilar:
1. Critical eye-focus & sharpness: fokus harus tajam di mata subjek utama. Motion blur/missed focus = gagal teknis (REJECTED). Shallow DoF/bokeh artistik atau creative framing = boleh (KEEP).
2. Micro-expressions & zero blinking: foto grup/pelaminan GUGUR (REJECTED, eyes_all_open=false) jika ada subjek utama mata merem/setengah tertutup atau mulut terbuka canggung. Pilih peak emotion terbaik.
3. Composition & framing: rule of thirds/leading lines/simetri/negative space. Tolak awkward cropping di sendi (pergelangan, lutut, dagu, dahi) dan horizon miring tidak disengaja.
4. Lighting & exposure: detail gaun putih tidak blown-out, jas gelap tidak blocked-up, catchlight baik, tanpa bayangan keras/raccoon eyes.
5. Background hygiene: objek tumbuh dari kepala, kru/photobomb, benda berantakan.
Aturan WAJIB: tepat SATU foto berstatus KEEP_BEST (zero-drop rule). Sisanya ALTERNATIVE (layak tapi kalah bagus) atau REJECTED (gagal). Beri skor 0-10 per pilar dan critique singkat (1-2 kalimat, bahasa Indonesia).

Output HARUS berupa JSON murni dengan format persis:
{
  "photos": [
    {
      "index": 0,
      "focus_sharpness": 8.5,
      "expression": 9.0,
      "composition": 8.0,
      "lighting": 8.5,
      "background_cleanliness": 9.0,
      "eyes_all_open": true,
      "status": "KEEP_BEST",
      "critique": "Fokus mata sangat tajam dan ekspresi senyum natural."
    }
  ]
}`;

/** Enforce zero-drop: pastikan tepat 1 KEEP_BEST per cluster. */
export function enforceZeroDrop(v: ClusterVerdictT): ClusterVerdictT {
  const overall = (p: z.infer<typeof PhotoVerdict>) =>
    (p.focus_sharpness + p.expression + p.composition + p.lighting + p.background_cleanliness) / 5;
  const keeps = v.photos.filter((p) => p.status === "KEEP_BEST");
  if (keeps.length === 1 || v.photos.length === 0) return v;
  const pool = keeps.length > 1 ? keeps : v.photos;
  const winner = pool.reduce((a, b) => (overall(b) > overall(a) ? b : a));
  return {
    photos: v.photos.map((p) =>
      p === winner
        ? { ...p, status: "KEEP_BEST" as const }
        : p.status === "KEEP_BEST"
        ? { ...p, status: "ALTERNATIVE" as const }
        : p
    ),
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
  // Clean potential markdown blocks
  const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleanJson);

  return enforceZeroDrop(ClusterVerdict.parse(parsed));
}
