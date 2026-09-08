# MPLSimulasi

Simulator local-first untuk klasemen, jadwal, probabilitas playoff, what-if scenario, dan Monte Carlo MPL.

## Menjalankan secara lokal

Project ini adalah aplikasi vanilla JavaScript berbasis ES Modules.

```bash
npm install
npm test -- --run
```

Untuk UI, gunakan static server dari root project, misalnya:

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Quality gates

CI menjalankan:

- Vitest test suite
- `npm audit --audit-level=moderate`
- `git diff --check`
- Batas ukuran file JavaScript 450 baris

## Arsitektur singkat

- `js/app.js`: bootstrap dan orchestration data.
- `js/rules/`: validasi, standings, tie-breaker, dan business rules.
- `js/simulation/`: engine simulasi dan worker.
- `js/modules/`: schedule, session, Supabase, export, importer, dan fitur domain.
- `js/ui/`: renderer DOM dan interaksi UI.
- `tests/`: regression dan integration tests.

## Data dan keamanan

- Simulasi pengguna disimpan local-first di `localStorage`.
- Shared prediction link tidak menulis payload prediksi ke cloud.
- Data import divalidasi terhadap tipe session, ID tim, ID match, referensi tim, dan skor Bo3.
- Data dinamis yang dirender ke HTML di-escape.
- Supabase anon key hanya boleh digunakan bersama RLS policy yang benar.

## Aturan standings

Urutan standings canonical:

1. Match wins
2. Net game difference
3. Head-to-head match record
4. Head-to-head net game difference
5. Total game wins
6. Tag/ID fallback deterministik

Comparator yang sama digunakan oleh standings dan clinch engine.

## Struktur localStorage

Key utama menggunakan namespace berikut:

- `mpl_sim_sessions`
- `mpl_teams_<sessionId>`
- `mpl_matches_<sessionId>`
- `mpl_settings_<sessionId>`
- `mpl_playoffs_<sessionId>`

Perubahan schema storage harus disertai migrator dan regression test.

## Deployment checklist

1. Jalankan test suite.
2. Jalankan `npm audit --audit-level=moderate`.
3. Pastikan `git diff --check` lulus.
4. Pastikan tidak ada source file di atas 450 baris.
5. Pastikan Supabase RLS dan policy sudah diverifikasi.
6. Commit lokal terlebih dahulu.
7. Push hanya dengan instruksi eksplisit.
