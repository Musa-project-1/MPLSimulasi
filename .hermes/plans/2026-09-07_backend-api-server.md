# Local Backend API Server Implementation Plan (Node.js + Express + SQLite)

> **For Hermes / JARVIS:** Use this plan to implement the local backend API server for MPLSimulasi task by task.

**Goal:** Mengganti dependensi data pure localStorage (Mock API) pada MPLSimulasi dengan Backend REST API Server lokal berbasis Node.js, Express, dan SQLite, dengan tetap mempertahankan mode fallback offline-first agar PWA tetap dapat beroperasi tanpa server.

**Architecture:** Arsitektur hybrid decoupled. Server Express menyediakan REST API `/api/*` dan terhubung ke database SQLite file lokal (`data/mplsim.db`). Frontend memiliki Data Adapter Layer (`js/modules/api.js`) yang mendeteksi ketersediaan API server; jika server aktif, data disinkronkan ke SQLite, jika server mati atau mode offline, client otomatis beralih ke local storage browser tanpa error.

**Tech Stack:** Node.js (ESM), Express.js, SQLite (`better-sqlite3` atau `sqlite3`), CORS, Vitest (integration testing), HTML5/Tailwind PWA.

---

### Task 1: Setup Backend Dependencies & Project Configuration

**Objective:** Menambahkan dependensi server (`express`, `cors`, `better-sqlite3`) dan script npm untuk menjalankan backend.

**Files:**
- Modify: `/mnt/c/Users/Musa/Documents/MPLSimulasi/package.json`
- Modify: `/mnt/c/Users/Musa/Documents/MPLSimulasi/.gitignore`

**Step 1: Update package.json scripts and dependencies**
- Tambahkan script: `"server": "node server/server.js"`, `"dev": "node --watch server/server.js"`
- Install dependencies: `express`, `cors`, `better-sqlite3` (atau sqlite native driver yang stabil di Windows/WSL).
- Install devDependency: `supertest` untuk integration test API.

**Step 2: Update .gitignore**
- Pastikan folder database lokal `data/*.db` dan `data/*.sqlite` diabaikan oleh git agar tidak membebani repository.

**Step 3: Verifikasi instalasi**
- Jalankan: `npm ls express cors`
- Expected: Dependensi terpasang tanpa error.

---

### Task 2: Database Schema & Migration Engine (`server/db.js`)

**Objective:** Membangun koneksi SQLite dan schema builder otomatis untuk tabel sesi, tim, pertandingan, playoff, dan konfigurasi simulator.

**Files:**
- Create: `/mnt/c/Users/Musa/Documents/MPLSimulasi/server/db.js`
- Test: `/mnt/c/Users/Musa/Documents/MPLSimulasi/tests/db.test.js`

**Step 1: Write failing test for SQLite initialization**
- Test pembuatan database di memori (`:memory:`) dan verifikasi schema table:
  - `sessions` (id TEXT PRIMARY KEY, name TEXT, timestamp INTEGER)
  - `teams` (id TEXT PRIMARY KEY, session_id TEXT, team_name TEXT, tag TEXT, points INTEGER, roster_json TEXT)
  - `matches` (id TEXT PRIMARY KEY, session_id TEXT, week INTEGER, day INTEGER, day_name TEXT, date TEXT, team_a_id TEXT, team_b_id TEXT, score_a TEXT, score_b TEXT, status TEXT, games_json TEXT)
  - `playoffs` (session_id TEXT PRIMARY KEY, bracket_json TEXT, is_forced INTEGER)
  - `settings` (session_id TEXT PRIMARY KEY, config_json TEXT)

**Step 2: Implement minimal `server/db.js`**
- Inisialisasi direktori `data/` jika belum ada.
- Eksekusi `CREATE TABLE IF NOT EXISTS` untuk seluruh relasi data.
- Sediakan fungsi CRUD helper: `getDb()`, `initDatabase(dbPath)`.
- Pastikan file berukuran < 250 baris.

**Step 3: Run test to verify pass**
- Jalankan: `npx vitest run tests/db.test.js`
- Expected: PASS (semua tabel terbuat dan schema valid).

---

### Task 3: REST API Controller & Routes (`server/routes/*`)

**Objective:** Membuat routing modular untuk operasi sesi, tim, jadwal pertandingan, skor, dan klasemen.

**Files:**
- Create: `/mnt/c/Users/Musa/Documents/MPLSimulasi/server/routes/sessions.js` (< 200 baris)
- Create: `/mnt/c/Users/Musa/Documents/MPLSimulasi/server/routes/matches.js` (< 200 baris)
- Create: `/mnt/c/Users/Musa/Documents/MPLSimulasi/server/routes/teams.js` (< 200 baris)
- Test: `/mnt/c/Users/Musa/Documents/MPLSimulasi/tests/api.test.js`

**Step 1: Write failing integration tests for API endpoints**
- `GET /api/health` -> 200 `{ status: "ok", timestamp: ... }`
- `GET /api/sessions` -> daftar sesi
- `POST /api/sessions` -> buat sesi baru + inisialisasi tim & jadwal default
- `GET /api/sessions/:id` -> data lengkap sesi (teams, matches, settings, playoffs)
- `DELETE /api/sessions/:id` -> hapus sesi dan relasi terkait
- `PUT /api/matches/:id/score` -> update skor pertandingan dan update agregat klasemen
- `PUT /api/matches/:id/teams` -> update tim home/away inline

**Step 2: Implement routes handlers**
- Pisahkan per modul agar masing-masing file < 200 baris kode.
- Hubungkan kalkulasi klasemen dan tie-breaker dengan modul `js/rules/standings.js` agar single-source-of-truth.

**Step 3: Run integration test to verify pass**
- Jalankan: `npx vitest run tests/api.test.js`
- Expected: PASS seluruh endpoint.

---

### Task 4: Express Server Entrypoint (`server/server.js`)

**Objective:** Entrypoint utama server yang mengintegrasikan middleware CORS, JSON body parser, static file serving (opsional untuk hosting lokal), dan API routing.

**Files:**
- Create: `/mnt/c/Users/Musa/Documents/MPLSimulasi/server/server.js` (< 150 baris)

**Step 1: Implement server.js**
- Gunakan port environment `PORT` (default: 3001 agar tidak bentrok dengan port front-end standar).
- Hubungkan middleware:
  - `cors()` untuk mengizinkan request dari browser client.
  - `express.json({ limit: '10mb' })` untuk payload JSON sesi.
  - Mount `/api` ke router yang telah dibuat.
  - Serve static frontend files jika diakses langsung via port server (`express.static('.')`).

**Step 2: Verify manual healthcheck**
- Start server sementara dan lakukan curl: `curl http://localhost:3001/api/health`
- Expected: `{"status":"ok", ...}`

---

### Task 5: Client-Side Hybrid Data Adapter (`js/modules/api.js`)

**Objective:** Membuat adapter jaringan pada frontend yang cerdas mendeteksi ketersediaan server lokal, menyinkronkan data, dan melakukan fallback mulus ke localStorage jika server tidak dijalankan.

**Files:**
- Create: `/mnt/c/Users/Musa/Documents/MPLSimulasi/js/modules/api.js` (< 220 baris)
- Modify: `/mnt/c/Users/Musa/Documents/MPLSimulasi/js/modules/schedule.js`
- Modify: `/mnt/c/Users/Musa/Documents/MPLSimulasi/js/modules/sessions.js`

**Step 1: Implement checkServerAvailability()**
- Lakukan lightweight ping ke `http://localhost:3001/api/health` saat inisialisasi aplikasi (timeout 600ms).
- Set state: `isServerConnected = true / false`.

**Step 2: Wrap fetchAPI() dengan Adapter**
- Jika `isServerConnected`:
  - Request diteruskan ke `http://localhost:3001/api/...`
- Jika `!isServerConnected`:
  - Request diproses secara lokal via `handleMockData()` dan `safeStorage` (localStorage).

**Step 3: Migration on first connect (Local to Server)**
- Jika user memiliki data lama di localStorage dan pertama kali menghubungkan server, berikan opsi/otomasi sinkronisasi sesi ke database SQLite server.

---

### Task 6: Visual Status Indicator pada Header (`index.html` & `js/ui/core.js`)

**Objective:** Memberikan indikator status visual modern di header agar user mengetahui apakah simulator sedang berjalan di mode "Server SQLite" atau "Offline PWA".

**Files:**
- Modify: `/mnt/c/Users/Musa/Documents/MPLSimulasi/index.html`
- Modify: `/mnt/c/Users/Musa/Documents/MPLSimulasi/js/ui/core.js`

**Step 1: Add status badge component to header**
- Di sebelah active session name, tambahkan badge:
  - Hijau: `● Server Connected (SQLite)`
  - Abu/Kuning: `● Standalone PWA (Local)`

**Step 2: Update status callback**
- Update badge saat server tersambung atau terputus secara dinamis tanpa refresh halaman.

---

### Task 7: Comprehensive Testing & Verification

**Objective:** Memastikan seluruh fitur klasemen, tie-breaker H2H, Monte Carlo simulation, dan export tetap 100% bekerja baik dengan backend server maupun fallback offline.

**Files:**
- Test: `/mnt/c/Users/Musa/Documents/MPLSimulasi/tests/standings.test.js`
- Test: `/mnt/c/Users/Musa/Documents/MPLSimulasi/tests/simulation.test.js`
- Test: `/mnt/c/Users/Musa/Documents/MPLSimulasi/tests/playoffs.test.js`
- Test: `/mnt/c/Users/Musa/Documents/MPLSimulasi/tests/quick_sim.test.js`
- Test: `/mnt/c/Users/Musa/Documents/MPLSimulasi/tests/api.test.js`

**Verification Steps:**
1. Jalankan unit test: `npm test` -> semua test wajib PASS.
2. Jalankan server: `npm run server` di background dan jalankan test API.
3. Cek ukuran baris seluruh file source: wajib strictly < 450 baris.
4. Cek zero em-dash compliance.
