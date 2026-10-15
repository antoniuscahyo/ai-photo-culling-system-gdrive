# AI Photo Culling System (GDrive SSO Edition)

Internal tool: seleksi ribuan foto event/wedding di Google Drive dengan standar kurasi fotografer profesional. Spec: PRD v1.2.

## Stack
Next.js (App Router) + Tailwind + `@tanstack/react-virtual` · Supabase (Auth Google, Postgres, Realtime) · Trigger.dev v4 (worker) · `sharp` (pre-AI) · Gemini 2.5 Flash (comparative culling).

## Pipeline
| Fase | Lokasi | Isi |
|---|---|---|
| 0 | `src/lib/gdrive.ts` `preflight` | Cek akses baca Source, `canAddChildren` Destination |
| 1 | `src/trigger/pipeline.ts` `scanProject` | `drive.files.list`, thumbnail `=s220` -> `=s1024` |
| 2 | `src/lib/image-analysis.ts` | dHash 64-bit + burst clustering (<4 detik & Hamming <10) |
| 3 | `src/lib/image-analysis.ts` | Histogram clipping + Variance of Laplacian |
| 4 | `src/lib/culling-ai.ts` `cullProject` | Gemini per cluster, 5 pilar, zero-drop rule |
| 5 | `syncProject` | Flat COPY/MOVE KEEP_BEST ke 1 folder Destination |

## Setup
1. `cp .env.example .env.local` lalu isi.
2. Jalankan `supabase/migrations/0001_init.sql` di Supabase.
3. Supabase Auth -> Google provider, scope `https://www.googleapis.com/auth/drive`, `access_type=offline`, `prompt=consent`.
4. `npx trigger.dev@latest dev` (worker) dan `npm run dev` (web).

## Catatan
- Threshold di `THRESHOLDS` (`image-analysis.ts`) perlu dikalibrasi dengan sampel foto asli.
- Scope `drive` penuh itu sensitif; Google akan minta verifikasi app kalau dipublikasikan.
- Status: scaffold backend/pipeline. Dashboard UI belum dibuat.
