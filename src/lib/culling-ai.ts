import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

export const MODEL = "gemini-2.5-flash";

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
Aturan WAJIB: tepat SATU foto berstatus KEEP_BEST (zero-drop rule). Sisanya ALTERNATIVE (layak tapi kalah bagus) atau REJECTED (gagal). Beri skor 0-10 per pilar dan critique singkat (1-2 kalimat, bahasa Indonesia). Jawab HANYA JSON sesuai schema.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    photos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          focus_sharpness: { type: Type.NUMBER },
          expression: { type: Type.NUMBER },
          composition: { type: Type.NUMBER },
          lighting: { type: Type.NUMBER },
          background_cleanliness: { type: Type.NUMBER },
          eyes_all_open: { type: Type.BOOLEAN },
          status: { type: Type.STRING, enum: ["KEEP_BEST", "ALTERNATIVE", "REJECTED"] },
          critique: { type: Type.STRING },
        },
        required: ["index","focus_sharpness","expression","composition","lighting","background_cleanliness","eyes_all_open","status","critique"],
      },
    },
  },
  required: ["photos"],
};

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
      p === winner ? { ...p, status: "KEEP_BEST" as const }
      : p.status === "KEEP_BEST" ? { ...p, status: "ALTERNATIVE" as const } : p),
  };
}

export async function cullCluster(images: Buffer[]): Promise<ClusterVerdictT> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const parts = images.flatMap((buf, i) => [
    { text: `Foto index ${i}:` },
    { inlineData: { mimeType: "image/jpeg", data: buf.toString("base64") } },
  ]);
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json", responseSchema, temperature: 0.2 },
  });
  return enforceZeroDrop(ClusterVerdict.parse(JSON.parse(res.text ?? "{}")));
}
