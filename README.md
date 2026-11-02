# AI Photo Culling System (GDrive SSO Edition)

Internal tool berbasis AI untuk memangkas waktu seleksi ribuan foto event & wedding photography di Google Drive dari **4–8 jam** menjadi **kurang dari 10 menit** menggunakan standar kurasi fotografer profesional.

Foto yang lolos seleksi langsung disinkronkan secara flat ke 1 folder tujuan Google Drive tanpa subfolder rumit.

---

## 🏗️ Architecture & Pipeline Design

```text
               +-------------------------------------------------------------+
               |                User / Photographer Browser                  |
               |       (Next.js 16 + Tailwind CSS + TanStack Virtual)        |
               +-----------------------------+-------------------------------+
                                             |
                                [Google OAuth SSO / Drive Scope]
                                             v
               +-------------------------------------------------------------+
               |                     Supabase Cloud                          |
               |    - Supabase Auth (Google Provider + Offline Refresh)      |
               |    - PostgreSQL (Projects, Clusters, Photos, Tokens)        |
               |    - Supabase Realtime (Live progress streaming)            |
               +-----------------------------+-------------------------------+
                                             |
                                  [Trigger Task Payload]
                                             v
               +-------------------------------------------------------------+
               |                 Trigger.dev v3 Cloud Worker                 |
               |                     (Preset: small-2x)                      |
               +-------------------------------------------------------------+
                        |                      |                      |
            [Fase 1: Indexing]       [Fase 2-3: Screening]      [Fase 4: Vision AI]
                        |                      |                      |
                        v                      v                      v
                Google Drive API         sharp (Node.js)      9Router / Antigravity
              - files.list metadata    - EXIF auto-rotate   - antigravity-combo
              - Batch upsert EXIF      - 64-bit dHash       - 5 Pilar Fotografi Pro
                                       - Temporal cluster   - Strict Focus Gate (>=6.5)
                                       - Laplacian variance - Zero non-human pass
                                                                      |
                                                                      v
                                                            [Fase 5: Flat Sync]
                                                            - drive.files.copy (COPY)
                                                            - drive.files.update (MOVE)
                                                            - Direct ke 1 folder tujuan
```

---

## ⚡ 6-Phase Pipeline Workflow

| Fase | Modul / Service | Deskripsi Kerja |
|---|---|---|
| **Fase 0** | `src/lib/gdrive.ts` (`preflight`) | Memvalidasi folder ID via Regex, cek izin akses baca di Source dan hak tulis (`canAddChildren`) di Destination. |
| **Fase 1** | `src/trigger/pipeline.ts` (`scanProject`) | Fast Indexing via Google Drive API tanpa download file asli. Mengambil metadata EXIF (`captured_at`, ISO, aperture, shutter speed) dan simpan ke Supabase. |
| **Fase 2** | `src/lib/image-analysis.ts` | **Temporal & Visual Clustering**: Menghitung 64-bit dHash. Foto dengan selisih waktu `< 4 detik` dan Hamming distance `< 10 bit` dikelompokkan ke satu `cluster_id` (burst/pose sama). |
| **Fase 3** | `src/lib/image-analysis.ts` | **Hard Technical Pre-Filter (`sharp`)**: Auto-rotate EXIF orientation, deteksi underexposure ekstrem/tutup lensa, overexposure flash, dan global camera shake via Variance of Laplacian. |
| **Fase 4** | `src/lib/culling-ai.ts` (`cullProject`) | **Comparative Vision AI**: Mengirim foto per cluster berdampingan ke engine AI dengan 5 Pilar Kurasi Fotografi Profesional + **Strict Quality Gate** (wajib ada manusia, mata terbuka, dan ketajaman fokus `>= 6.5/10`). |
| **Fase 5** | `src/trigger/pipeline.ts` (`syncProject`) | **Flat Destination Sync**: Menyalin (`COPY`) atau memindahkan (`MOVE`) semua file berstatus `KEEP_BEST` langsung ke folder tujuan Google Drive tanpa subfolder tambahan. |

---

## 📸 5 Pilar Standar Kurasi Fotografi Profesional

Instruksi Vision AI difokuskan secara mendalam pada 5 parameter penilaian utama:

1. **Critical Eye-Focus & Sharpness (Prioritas Utama)**:
   - Fokus wajib mengunci tajam pada mata subjek utama (*tack-sharp eyes*).
   - Memiliki **Strict Cutoff Gate** (`focus_sharpness >= 6.5`): Jika subjek mengalami *motion blur* ringan (~10%), *camera shake*, atau *missed-focus*, foto otomatis berstatus **REJECTED**.
2. **Micro-Expressions & Zero Blinking**:
   - Mengecek setiap wajah dalam frame. Subjek utama yang berkedip, mata setengah tertutup, atau mulut terbuka canggung saat mengunyah/berbicara otomatis digugurkan.
   - Memilih puncak emosi terbaik (*peak emotion*) di antara rangkaian jepretan burst.
3. **Professional Composition & Framing**:
   - Menilai keseimbangan visual (Rule of Thirds, Simetri, Leading Lines, Negative Space).
   - Menolak *awkward cropping* pada persendian (pergelangan tangan, lutut, leher, dagu) dan kemiringan horizon tak disengaja.
4. **Lighting & Exposure Integrity**:
   - Detail gaun pengantin putih tidak *blown-out* (*highlight roll-off*) dan jas gelap tidak *blocked-up*.
   - Kualitas jatuhnya cahaya di wajah (*catchlight* alami tanpa bayangan keras/raccoon eyes).
5. **Background Hygiene & Subject Separation**:
   - Menolak distraksi visual seperti benda yang seolah tumbuh dari kepala subjek, photobomb kru/tamu tak sengaja, atau benda berantakan di latar belakang.
6. **Human-Only Subject Enforcement**:
   - Foto tanpa subjek manusia (tanaman, pohon, lantai, jalan, atau jepretan salah pencet) otomatis di-**REJECT**, menonaktifkan pemaksaan pemenang tunggal (*zero-drop*) jika tidak ada foto yang layak.

---

## 🛠️ Tech Stack & Provider

### 1. Frontend & Web Application
* **Framework**: Next.js 16 (App Router, Turbopack, TypeScript)
* **Styling**: Tailwind CSS
* **Virtualization**: `@tanstack/react-virtual` (Menjamin render ribuan foto lancar di mobile & desktop tanpa lag DOM)
* **Icons**: `lucide-react`
* **Hosting**: Vercel

### 2. Authentication & Database
* **Database**: Supabase PostgreSQL dengan Row Level Security (RLS)
* **Auth**: Supabase Auth dengan Google OAuth Provider (scope `https://www.googleapis.com/auth/drive`, `access_type=offline`, `prompt=consent`)
* **Realtime**: Supabase Realtime WebSocket (Streaming progress bar scanning & kurasi live ke dashboard)

### 3. Background Worker & Queue
* **Orchestrator**: Trigger.dev v3 Cloud Worker
* **Machine Preset**: `small-2x` (1 vCPU, 1 GB RAM) untuk memastikan pemrosesan batch buffer gambar via `sharp` bebas OOM
* **Concurrency Control**: Throttling terpisah untuk Google Drive API (max 10 concurrency) dan Vision AI (max 3 concurrency)

### 4. Vision AI Engine & Provider
* **Gateway**: **9Router** (`antigravity`) via OpenAI-compatible endpoint (`/v1/chat/completions`)
* **Model**: `antigravity-combo` (Upstream: `gemini-3.8-flash-n`)
* **Format**: Structured JSON Output dengan temperature rendah (`0.2`) untuk konsistensi grading skor dan penulisan critique fotografi dalam Bahasa Indonesia.

### 5. Media & Image Processing
* **Pre-AI Engine**: `sharp` (Node.js native C++ libvips binding)
* **Image Proxy**: Next.js Secure Streaming Proxy (`/api/photos/[id]/thumbnail`) dengan auto-rotate EXIF orientation dan cache control untuk menghindari Google Drive 403 Forbidden.
* **Client-Side Loading**: Komponen `LazyImage` dengan `IntersectionObserver` dan placeholder shimmer.

---

## 🔐 Environment Variables

File `.env.local` dan environment variables di Vercel / Trigger.dev:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# AI Engine (9Router / Antigravity Gateway)
AI_BASE_URL=http://<router-ip>:20129/v1
VISION_MODEL=antigravity-combo
AI_API_KEY=sk-...

# Trigger.dev v3
TRIGGER_PROJECT_REF=proj_...
TRIGGER_SECRET_KEY=tr_prod_sk_...
TRIGGER_ACCESS_TOKEN=tr_pat_...
```

---

## 🚀 Setup & Local Development

1. **Clone repository**:
   ```bash
   git clone git@github.com:antoniuscahyo/ai-photo-culling-system-gdrive.git
   cd ai-photo-culling-system-gdrive
   npm install
   ```

2. **Setup Database**:
   Jalankan script SQL di `supabase/migrations/0001_init.sql` pada SQL Editor Supabase Anda.

3. **Deploy Worker Trigger.dev**:
   ```bash
   npx trigger.dev@latest deploy --env prod
   ```

4. **Jalankan Web App**:
   ```bash
   npm run dev
   ```
