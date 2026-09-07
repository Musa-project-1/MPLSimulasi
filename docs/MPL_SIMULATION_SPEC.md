# Spesifikasi Algoritma & Logika Simulasi MPL (Mobile Legends Professional League)

Dokumen ini mendefinisikan standar matematis, probabilitas Monte Carlo, aturan tie-breaker resmi, serta skenario pengujian komprehensif untuk project MPLSimulasi.

---

## 1. Algoritma Dasar Performa Tim (Base Win Rate)

Kekuatan awal tim dihitung menggunakan Bayesian Laplace Smoothing untuk mencegah bias sampel kecil pada awal musim:

$$WR_0 = \frac{Match_{Win} + 1}{Match_{Played} + 2}$$

### Mekanisme Momentum (Streak Bonus)
Jika tim mencatatkan 3 kemenangan beruntun (*win-streak*) pada 3 pertandingan kompetitif terakhir yang telah selesai:

$$WR = WR_0 + 0.05$$

---

## 2. Modifikasi Probabilitas Pertandingan Dinamis

Dalam laga antara Tim A dan Tim B, probabilitas dasar Tim A menang dihitung dengan:

$$P_{base}(A) = \frac{WR_A}{WR_A + WR_B}$$

### A. Modifikator Rivalitas (Rivalry Derby & Underdog Boost)
Derby klasik (contoh: RRQ vs EVOS 'El Clasico' intensitas 1.2, ONIC vs BTR 'The Royal Derby' intensitas 1.15) memberikan dorongan kejutan kepada tim *underdog*:

- Jika $P_{base}(A) < 0.5$ (Tim A adalah underdog):
  $$P(A) = P_{base}(A) + (Intensitas - 1) \times 0.5$$
- Jika $P_{base}(A) \ge 0.5$ (Tim A adalah favorit):
  $$P(A) = P_{base}(A) - (Intensitas - 1) \times 0.5$$

### B. Modifikator Head-to-Head (H2H Bias)
Jika fitur H2H diaktifkan dan kedua tim pernah bertemu di musim berjalan:

$$P_{H2H}(A) = \frac{Wins_{H2H}(A)}{Wins_{H2H}(A) + Wins_{H2H}(B)}$$
$$P(A) = (0.7 \times P(A)) + (0.3 \times P_{H2H}(A))$$

### C. Modifikator Kelelahan Jadwal (Fatigue Penalty)
- Bermain di hari berurutan (misal Sabtu lalu Minggu): Akumulasi kelelahan $+15\%$.
- Istirahat 2 hari atau lebih: Pemulihan kelelahan $-10\%$ (minimum 0%).
- Penalti pada probabilitas kemenangan:
  $$Penalti_A = \frac{Fatigue_A}{100} \times 0.10$$
  $$P(A) = P(A) - Penalti_A + Penalti_B$$

### D. Faktor Volatilitas (Luck Factor)
Faktor kejutan diatur oleh slider volatilitas $V \in [0, 100]$:

$$Factor = \frac{V}{100}$$
$$P_{final}(A) = (P(A) \times (1 - Factor)) + (0.5 \times Factor)$$

Dibatasi dalam rentang aman:

$$P_{final}(A) = \max(0.10, \min(0.90, P_{final}(A)))$$

---

## 3. Format Pertandingan Regular Season (Best of 3)

Hasil set pertandingan dibangkitkan secara probabilistik:
- Jika $Random() < P_{final}(A)$: Tim A Menang.
  - Skor 2-0 (Clean Sweep): Probabilitas 55%.
  - Skor 2-1 (Decider Game): Probabilitas 45%.
- Jika sebaliknya: Tim B Menang (0-2 atau 1-2).

Poin klasemen dihitung dari selisih game (*Net Game Difference*):
$$\Delta Poin = Game_{Win} - Game_{Lose}$$

---

## 4. Regulasi Tie-Breaker Resmi MPL Regular Season

Jika dua atau lebih tim memiliki poin klasemen yang sama, urutan penentuan peringkat menggunakan hierarki resmi MPL:

1. **Match Points (W-L Match)**: Jumlah kemenangan match Bo3.
2. **Net Game Difference (Game Points)**: Selisih kemenangan game ($Game_{Win} - Game_{Lose}$).
3. **Head-to-Head (H2H) Match Result**: Rekor kemenangan langsung antara tim yang bernilai sama.
4. **Head-to-Head (H2H) Game Difference**: Selisih game dalam pertemuan langsung antara tim yang bersangkutan (misal seri 1-1 pada putaran double round-robin).
5. **Total Game Wins**: Jumlah kemenangan game terbanyak di seluruh musim.
6. **Deterministic Fallback**: Berdasarkan abjad tag tim.

---

## 5. Struktur Alokasi Bracket Playoff

- **Peringkat 1 & 2**: Lolos ke **Upper Bracket Semifinals** (Mendapatkan bye di ronde pertama).
- **Peringkat 3, 4, 5, 6**: Bertanding di ronde **Play-ins**:
  - Match 1: Peringkat 3 vs Peringkat 6.
  - Match 2: Peringkat 4 vs Peringkat 5.
- **Peringkat 7, 8, 9**: Tereliminasi dari turnamen.

---

## 6. Proyeksi Probabilitas Monte Carlo (30.000 Iterasi)

Untuk setiap simulasi musim penuh ($N = 30.000$ iterasi):

- **Probabilitas Upper Bracket**:
  $$P_{upper} = \frac{\sum [Peringkat \le 2]}{N} \times 100\%$$
- **Probabilitas Playoff**:
  $$P_{playoff} = \frac{\sum [Peringkat \le 6]}{N} \times 100\%$$
- **Probabilitas Play-in**:
  $$P_{playin} = P_{playoff} - P_{upper}$$
- **Probabilitas Eliminasi**:
  $$P_{elim} = \frac{\sum [Peringkat \ge 7]}{N} \times 100\%$$

---

## 7. Matriks Skenario Pengujian (Test Scenarios)

1. **Skenario 1**: Akurasi perataan Laplace win-rate awal saat tim belum memiliki rekor tanding.
2. **Skenario 2**: Peningkatan win-rate tim dengan momentum 3 kemenangan beruntun.
3. **Skenario 3**: Efek kejutan tim underdog saat rivalitas intensitas tinggi diaktifkan.
4. **Skenario 4**: Dampak akumulasi penalti kelelahan jadwal berturut-turut terhadap probabilitas menang.
5. **Skenario 5**: Penyelesaian tie-breaker H2H ketika rekor match dan game points identik.
6. **Skenario 6**: Penyelesaian tie-breaker selisih game H2H saat seri 1-1 pada double round-robin.
7. **Skenario 7**: Konsistensi pembagian slot bracket playoff Top 6 dan pemenuhan total probabilitas 100%.
