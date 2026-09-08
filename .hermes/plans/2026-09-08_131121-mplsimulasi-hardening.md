# MPLSimulasi Production Hardening Plan

> **For Hermes:** Implement task-by-task with tests first, review every security boundary, and do not push unless explicitly requested.

**Goal:** Menjadikan MPLSimulasi lebih aman, teruji, dapat dipulihkan, mudah dipelihara, dan layak untuk deployment publik/shared cloud tanpa mengorbankan model local-first.

**Architecture:** Pertahankan vanilla JS dan local-first storage. Pisahkan aturan domain dari renderer UI, jadikan Supabase read/public dan admin mutation memiliki boundary yang jelas, lalu tambahkan automated browser checks, security headers, observability, recovery, dan release gates.

**Tech Stack:** Vanilla ES Modules, Vitest, Supabase REST/PostgREST, GitHub Actions, Playwright untuk smoke test, static hosting/Vercel.

---

## Current Context and Constraints

- Repository: `/mnt/c/Users/Musa/Documents/MPLSimulasi`
- Branch saat ini: `main`; perubahan terakhir sudah dipush sebagai `b4e3184`.
- Baseline terakhir: 17 test files dan 86 tests lulus; `npm audit --audit-level=moderate` melaporkan 0 vulnerability.
- `index.html` sekitar 1097 baris; batas source JS project adalah 450 baris.
- `supabase_schema.sql` saat ini memberi `anon` policy `FOR ALL ... USING (true) WITH CHECK (true)` pada seluruh tabel; ini blocker production.
- UI masih memiliki banyak `innerHTML` dan inline `onclick`; sebagian nilai sudah di-escape, tetapi belum konsisten.
- Jangan menghapus data OneDrive/C: drive, jangan melakukan push, dan jangan mengubah production Supabase tanpa instruksi/approval eksplisit.

## Non-goals

- Tidak mengganti framework secara besar-besaran.
- Tidak menghapus local-first storage.
- Tidak menambahkan backend kompleks bila Supabase Auth + Edge Function cukup.
- Tidak upgrade major dependency bersamaan dengan security refactor.
- Tidak mengklaim browser UX verified tanpa Playwright/browser execution yang benar-benar lulus.

---

## Phase 0 — Baseline, Branch, and Safety

### Task 0.1: Capture baseline

Files: `.hermes/plans/` only initially.

- Catat `git status`, current commit, test result, audit result, file-size report, dan dependency tree.
- Buat branch kerja terpisah dari `main`, misalnya `hardening/production-readiness`.
- Pastikan branch bersih sebelum tiap phase.

Verification:

```bash
npm test -- --run
npm audit --audit-level=moderate
npm run lint --if-present
npm run build --if-present
 git diff --check
```

Expected: baseline terdokumentasi; kegagalan existing dipisahkan dari regression baru.

### Task 0.2: Define release checklist and ownership

Modify: `README.md`, create `docs/production-readiness.md`.

- Dokumentasikan siapa yang boleh menjalankan migration Supabase.
- Tandai environment yang diperlukan: local, preview, production.
- Tambahkan rollback owner dan backup requirement.
- Tegaskan bahwa anon key bukan secret, tetapi service-role key tidak boleh masuk client.

---

## Phase 1 — Supabase Authorization and Data Integrity (P0)

### Task 1.1: Inventory every cloud operation

Inspect/modify: `js/modules/supabase.js`, `js/modules/admin.js`, `js/modules/sessions.js`, `js/modules/quick_importer.js`, `tests/supabase.test.js`.

- Buat tabel operasi: GET public, session mutation, official schedule mutation, broadcast mutation, admin-only mutation.
- Pastikan client tidak pernah menerima atau mengirim service-role key.
- Beri nama operation yang eksplisit dan jangan mengandalkan endpoint string bebas dari input user.

### Task 1.2: Add server-side admin authorization design

Create: `supabase/migrations/001_security_baseline.sql`, `supabase/functions/admin-mutate/index.ts` atau dokumentasikan Edge Function yang dipilih.

- Gunakan Supabase Auth untuk identitas admin.
- Simpan admin role pada claim/table yang dapat diverifikasi server-side.
- Pindahkan official schedule/broadcast write ke Edge Function atau RPC `SECURITY DEFINER` yang sempit.
- Jangan mempercayai `localStorage` flag sebagai authorization.

### Task 1.3: Replace broad anon policies

Modify: `supabase_schema.sql` dan migration.

- Public data: `SELECT` seperlunya untuk anon.
- User-owned session: akses berdasarkan owner/session token atau gunakan private local-first untuk data personal.
- Admin tables: mutation hanya authenticated admin.
- `schedule_templates`: anon read bila memang public; write hanya admin backend.
- Tambahkan `WITH CHECK` yang membatasi kolom dan ownership.
- Hapus/drop policy broad setelah policy pengganti diverifikasi.

### Task 1.4: Add policy verification tests and runbook

Create: `tests/security-policy.test.js`, `docs/supabase-security.md`.

- Uji anon read yang memang diizinkan.
- Uji anon insert/update/delete harus ditolak untuk admin data.
- Uji authenticated non-admin ditolak.
- Uji admin resmi berhasil.
- Test terhadap project Supabase test/preview, bukan destructive production.

Acceptance: tidak ada `FOR ALL TO anon USING (true)` untuk tabel production; runbook backup, apply, verify, rollback tersedia.

---

## Phase 2 — XSS and DOM Safety (P0)

### Task 2.1: Create safe DOM helpers

Create: `js/ui/dom.js`, `tests/dom.test.js`.

- `escapeHTML` tetap tersedia sebagai compatibility helper.
- Sediakan `setText`, `setAttr`, `createElement`, dan event binding berbasis `addEventListener`.
- Identifier user tidak boleh masuk ke JavaScript string inline.
- Tambahkan tests untuk quotes, backticks, HTML tags, event payload, dan URL attributes.

### Task 2.2: Remove inline handlers from team and roster UI

Modify: `js/ui/teams.js`, `index.html` bila selector diperlukan, relevant modules.

- Ganti `onclick="...${value}..."` menjadi `data-action`/`data-id` + delegated listener.
- Gunakan `textContent` untuk nick, role, team name, tag, dan player stats.
- Validasi ID saat handler membaca `dataset`.
- Jangan mencampur HTML escaping dengan JavaScript escaping sebagai solusi permanen.

Tests: malicious team/player/session names render sebagai teks dan tidak mengeksekusi script.

### Task 2.3: Remove inline handlers from session, match, standings, and admin UI

Modify: `js/ui/core.js`, `js/ui/matches.js`, `js/ui/standings.js`, `js/ui/admin.js`, `js/ui/playoffs.js`, related modules.

- Migrasikan bertahap per renderer.
- Pertahankan compatibility bridge hanya sementara untuk markup yang belum migrated.
- Setelah reference search membuktikan tidak ada pemakai, hapus wrapper inline yang dead.

### Task 2.4: Audit all dynamic sinks

- Search ulang `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `onclick`, `onerror`, `eval`, `new Function`.
- Setiap sink harus punya alasan aman yang terdokumentasi atau diganti DOM API.
- Dynamic SVG/logo harus membatasi input ke whitelist tag/ID.

Acceptance: tidak ada untrusted value yang dapat membentuk executable HTML/JS; regression suite lulus.

---

## Phase 3 — Security Headers and Supply Chain

### Task 3.1: Add deploy security headers

Create/modify: `vercel.json` atau konfigurasi host yang benar-benar dipakai.

Headers minimum:

- `Content-Security-Policy` dengan source yang eksplisit; hindari `unsafe-eval` dan rencanakan penghapusan `unsafe-inline`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` membatasi camera, microphone, geolocation bila tidak digunakan.
- `Strict-Transport-Security` hanya pada HTTPS production setelah domain dipastikan benar.

CSP harus diuji dalam Report-Only lebih dulu bila dependency CDN/inline masih diperlukan.

### Task 3.2: Pin and review third-party assets

Modify: `index.html`, `package.json`, lockfile jika diperlukan.

- Pin versi Chart.js, html2canvas, jsPDF, Phosphor, fonts.
- Prefer npm/bundling lokal untuk runtime production.
- Jika CDN dipertahankan, gunakan SRI untuk script yang mendukungnya dan dokumentasikan alasan.
- Jangan melakukan upgrade major bersamaan dengan migration security.

Verification: `npm audit --audit-level=moderate`; review lockfile; smoke test tidak menghasilkan blocked-resource error.

---

## Phase 4 — Validation, Storage, and Recovery

### Task 4.1: Make import validation strict

Modify: `js/rules/validators.js`; tests: `tests/validators.test.js`.

- Bedakan field kosong yang valid dari field malformed.
- Tolak numeric garbage, NaN, infinite, range invalid, duplicate player IDs, invalid roles, invalid references, self-match, dan oversized payload.
- Validasi roster dan games secara rekursif pada batas import.
- Derive status dari validated scores, bukan mempercayai input.
- Tambahkan batas jumlah team/match/player untuk mencegah memory abuse.

### Task 4.2: Harden URL/hash and cloud response boundaries

Modify: `js/modules/share_url.js`, `js/modules/supabase.js`, relevant tests.

- Batasi ukuran hash/query.
- Parse dengan try/catch dan schema validator yang sama.
- Validasi response Supabase sebelum memasukkannya ke Store/DOM.
- Jangan menampilkan raw server error yang dapat membeberkan internal detail.

### Task 4.3: Centralize storage access and error reporting

Modify: `js/store.js`, `js/app.js`, `js/modules/playoffs.js`, `js/modules/admin.js`, `js/simulation/engine.js`.

- Ganti direct `localStorage` calls dengan `Store.safeStorage` atau API storage terpusat.
- Hentikan `catch (_) {}` kosong; beri context-safe log dan toast yang tidak membocorkan secret.
- Tangani quota exceeded, malformed JSON, unavailable storage, dan migration failure secara berbeda.
- Gunakan backup export sebelum migration destructive.

### Task 4.4: Add migration rollback and recovery UX

Modify: `js/store.js`, `index.html`, relevant UI; tests: `tests/store.test.js`.

- Migration idempotent dan versioned.
- Simpan backup snapshot sebelum migrasi.
- Sediakan restore last backup dan reset corrupted session secara terkontrol.
- Tampilkan status export/backup terakhir.
- Delete session harus memiliki confirmation yang menyebut data lokal/cloud.

---

## Phase 5 — Authentication and Admin Boundary

### Task 5.1: Audit client-side admin auth

Inspect/modify: `js/modules/admin_auth.js`, admin modules, tests.

- Identifikasi semua token/flag yang disimpan di localStorage.
- Tandai client-side gate sebagai UX-only.
- Jangan mengizinkan mutation cloud berdasarkan flag lokal.
- Tambahkan expiry, logout, dan clear credential behavior untuk UI state.

### Task 5.2: Integrate authenticated admin flow

- Gunakan Supabase Auth session yang diverifikasi oleh server policy/function.
- Tangani expired session, refresh, logout, dan unauthorized response.
- Admin UI harus hide/disable berdasarkan auth state, tetapi server tetap enforcement utama.

Acceptance: memodifikasi localStorage tidak memberi hak cloud mutation.

---

## Phase 6 — Automated Browser and Accessibility QA

### Task 6.1: Add Playwright smoke test setup

Create: `playwright.config.js`, `tests/e2e/smoke.spec.js`; modify `package.json`, CI.

Smoke flow:

1. Load landing page.
2. Create session.
3. Open dashboard.
4. Open teams/roster, standings, matches, playoffs.
5. Import/export a valid JSON fixture.
6. Verify invalid import error.
7. Verify mobile viewport.
8. Fail on uncaught page error and unexpected console error.

Use deterministic local fixture/mock; jangan bergantung pada live production Supabase untuk test rutin.

### Task 6.2: Accessibility checks

- Tambahkan axe atau equivalent ringan pada smoke flow.
- Audit labels, heading hierarchy, keyboard focus, modal focus trap, focus return, `aria-live` toast, button semantics, contrast, reduced motion.
- Ganti clickable `<div>` dengan `<button>`/semantic element.
- Tambahkan regression test untuk keyboard close/escape dan focus.

Acceptance: smoke pass pada desktop dan mobile; known violations terdokumentasi dengan owner.

---

## Phase 7 — Coverage, CI, and Release Gates

### Task 7.1: Configure coverage

Modify: `package.json`, `vitest.config.js` atau config yang dipakai; tests di `tests/`.

- Tambahkan `test:coverage`.
- Tetapkan threshold awal lines/functions 80%, branches 70%, lalu naikkan setelah baseline.
- Prioritaskan validators, standings comparator, importer, storage migration, Supabase error path, dan admin boundary.

### Task 7.2: Expand GitHub Actions

Modify: `.github/workflows/ci.yml`.

Stages:

- `npm ci`
- unit test
- coverage threshold
- `npm audit --audit-level=moderate`
- `git diff --check`
- source-size check untuk JS dan batas documented untuk HTML
- Playwright install + smoke test
- optional artifact upload untuk report saat failure

Pin action versions by major/current policy dan jangan simpan credentials di repository.

### Task 7.3: Add static security checks

- CI search untuk `service_role`, private key patterns, accidental credential literals.
- CI search untuk new inline handlers and dangerous sinks, dengan allowlist migration yang eksplisit.
- Validate schema migration syntax where a safe tool is available.

---

## Phase 8 — Refactor Structure and Maintainability

### Task 8.1: Decompose `index.html`

Modify: `index.html`; create focused template fragments/modules where compatible with static deployment.

- Kelompokkan session, dashboard, teams, matches, standings, playoffs, settings, admin, and modal markup.
- Jangan membuat build system besar hanya untuk memecah markup; pilih approach yang tetap dapat dijalankan static.
- Targetkan file dapat dinavigasi dan setiap modal punya owner jelas.
- Pastikan IDs dan selectors tetap backward-compatible selama migration.

### Task 8.2: Centralize refresh orchestration

Modify: `js/ui/refresh.js` dan mutation modules.

- Gunakan registry/event bridge untuk refresh.
- Tambahkan generation/request token agar refresh stale tidak overwrite state terbaru.
- Pastikan rejection async ditangani.
- Hapus wrapper hanya setelah reference search.

### Task 8.3: Add observability hooks

Create/modify: `js/observability.js`, `js/app.js`, tests.

- Global `error` dan `unhandledrejection` handler.
- Debug mode opt-in.
- Context module/action/session ID tanpa key atau payload sensitif.
- User-facing generic error + recovery action.

---

## Phase 9 — Performance and Data Volume

### Task 9.1: Measure before optimizing

Create: `docs/performance-baseline.md`.

Measure:

- initial transfer and time-to-interactive
- third-party transfer
- rendering large teams/matches/rosters
- Monte Carlo duration and memory
- localStorage payload size

### Task 9.2: Apply bounded optimizations

- Lazy-load html2canvas/jsPDF/chart features saat dipakai.
- Batch DOM updates dengan `DocumentFragment`.
- Avoid repeated `innerHTML +=` in loops.
- Bound query result and local payload size.
- Ensure worker cleanup and cancellation.

Verification: before/after numbers, no regression in functional tests, no invented manual UX result.

---

## Phase 10 — Documentation, Review, and Release

### Task 10.1: Update documentation

Modify: `README.md`; create/update `docs/production-readiness.md`, `docs/supabase-security.md`, `docs/recovery.md`, `docs/performance-baseline.md`.

Document:

- architecture and data flow
- local-first guarantees
- cloud tables and authorization model
- import/export schema and migration policy
- deployment headers/CSP
- backup/recovery
- incident response and key rotation
- test commands and known limitations

### Task 10.2: Perform five-axis review

Review correctness, readability, architecture, security, and performance. Findings severity:

- Critical: blocks release
- Required: must fix before merge
- Optional: follow-up issue
- Nit: cosmetic only

Check dead code only after reference search. Do not silently delete uncertain legacy wrappers.

### Task 10.3: Final verification and release candidate

Run:

```bash
npm ci
npm test -- --run
npm run test:coverage
npm audit --audit-level=moderate
git diff --check
npm run build --if-present
npx playwright test
```

Also verify:

- no file exceeds project limit without documented exception
- no service-role/private key in tracked files
- anon cannot mutate admin cloud data
- migration rollback tested on non-production
- browser smoke and accessibility checks pass
- working tree diff reviewed file by file

Only after all gates pass: commit locally. Push only with explicit user instruction.

---

## Suggested Commit Sequence

Keep changes reviewable and separately revertible:

1. `test: establish hardening baseline and coverage`
2. `fix(security): enforce Supabase authorization boundaries`
3. `fix(security): remove unsafe dynamic event handlers`
4. `fix(validation): harden import, URL, and storage boundaries`
5. `feat(test): add browser smoke and accessibility checks`
6. `ci: add coverage, browser, and secret quality gates`
7. `refactor(ui): decompose markup and centralize refresh orchestration`
8. `perf: bound rendering and lazy-load export features`
9. `docs: publish production readiness and recovery runbooks`

Each commit must pass relevant tests. Do not squash security and unrelated refactor unless reviewability improves.

## Open Decisions Before Implementation

1. Apakah cloud sessions memang harus writable oleh user biasa, atau seluruh simulation data tetap local-first dan cloud hanya official data?
2. Hosting production final Vercel atau host lain? Ini menentukan security-header file.
3. Apakah Supabase Auth sudah tersedia untuk admin, atau perlu dibuat dari nol?
4. Apakah Playwright boleh ditambahkan sebagai dev dependency?
5. Apakah pembagian `index.html` tetap harus zero-build/static-only, atau build step kecil dapat diterima?
6. Environment test Supabase mana yang aman untuk policy integration test?

## Definition of Done

MPLSimulasi dianggap siap untuk release berikutnya apabila:

- no critical security finding remains;
- anon policy tidak memberikan arbitrary mutation;
- dynamic user/cloud data tidak dieksekusi sebagai HTML/JS;
- import, URL, storage, and cloud responses tervalidasi;
- migration backup/rollback tersedia;
- unit, coverage, browser smoke, accessibility, audit, and CI checks lulus;
- security headers dan third-party policy terdokumentasi;
- performance baseline tercatat;
- README/runbooks diperbarui;
- final diff direview dan push dilakukan hanya atas instruksi eksplisit.
