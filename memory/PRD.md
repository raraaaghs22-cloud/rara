# PRD — Seni Musik XI: Jurnal Kelas & Penilaian AI

## Original problem statement
Guru Seni Musik SMA (12 kelas, Kelas XI 1–XI 12) ingin aplikasi full-stack jurnal kelas + penilaian AI otomatis. Siswa mengumpulkan link video tugas (TikTok/Instagram/Facebook/YouTube) di /submit (publik, bilingual EN/ID, kolom: Nama Lengkap, Kelas, Nomor Absen, Link Video). Validasi platform, simpan sebagai Private Draft, tampilkan pesan "Your video assignment link has been successfully submitted / Tugas link video Anda berhasil dikirimkan." Siswa tidak melihat proses AI. Dashboard guru dengan Emergent Google Auth (akun pertama login = Admin), tabel jurnal 12 kelas, filter, tinjau/edit hasil AI, privasi ketat (siswa hanya melihat status & nilai akhir yang dipublikasikan), ekspor CSV/Excel. AI: Gemini 3.1 Pro, inspeksi hybrid (oEmbed + URL metadata). Tugas "Creative Video Project: Musik di Sekitar Kita" (60–90 dtk, 9:16, fungsi musik + contoh nyata, subtitle). Rubrik: Content & Context 50%, Delivery & Subtitles 30%, Technical & Tagging 20% (#FungsiMusik, @Mr. Ocha). Output: skor 0–100, grade A/B/C/D, Strengths, Weaknesses & Suggestions.

User choices: guru bisa mengatur apakah halaman nilai siswa ditampilkan; AI otomatis di latar belakang; kirim ulang = pengumpulan baru (riwayat); desain terang & modern.

## Architecture
- Backend: FastAPI single `server.py`, MongoDB (users, user_sessions, submissions, settings). Background task grading via emergentintegrations (gemini-3.1-pro-preview, EMERGENT_LLM_KEY). Metadata: YouTube/TikTok oEmbed + page og/meta tags (+ YouTube lengthSeconds/description).
- Admin: db.settings {key:"admin"} — seeded from ADMIN_EMAIL=raraaaghs22@gmail.com, otherwise first login.
- Frontend: React routes /submit, /results, /login, /dashboard (protected). Lang context ID/EN.

## Personas
- Guru (admin): meninjau, mengedit, mempublikasikan, mengekspor nilai.
- Siswa (publik): mengirim link, cek status/nilai akhir yang dipublikasikan.

## Implemented (2026-10-08)
- Public submit form with platform detection & validation, exact success message, bilingual.
- Public /results (toggle by teacher), returns only status + published final score & grade.
- Google auth, admin-only dashboard: stats, filters, review sheet (rubric edit → auto recompute, strengths/weaknesses, private notes, publish), regrade, delete, bulk publish, CSV + Excel (all-classes + per-class sheets) export.
- Auto AI grading with failure status + restart recovery. Tested: 23/23 backend, frontend flows pass.

## Backlog
- P1: Show AI data-confidence filter; per-class export button.
- P2: Split server.py into routers; email notification to teacher on new submission.

## Update (Juni 2026)
- Rekap Per Kelas: tombol di Toolbar dashboard (ClassExportMenu.jsx) -> pilih kelas -> unduh CSV/Excel satu kelas. Backend `GET /api/admin/export?class_name=XI N` menamai file `rekap_nilai_seni_musik_kelas_XI_N_<tgl>` dan Excel hanya berisi 1 sheet kelas tsb. Diverifikasi via curl + screenshot.

## Update (Juni 2026) — Prompt AI v2
- System prompt Gemini diganti sesuai spesifikasi guru (peran objektif, rubrik caption-based 50/30/20, skala huruf A>90/B80-89/C70-79/D<70).
- Fallback: jika metadata kosong/diblokir (has_readable_text False) atau AI mengembalikan unreadable=true -> skor 0, grade N/A, strengths "-", weaknesses pesan privasi. Tidak memanggil AI jika metadata tidak terbaca.
- UI: badge grade N/A (abu-abu). Diverifikasi E2E via curl (YouTube publik -> dinilai; IG privat -> N/A).

## Update (Juni 2026) — Hapus Data
- Kolom Aksi di tabel dashboard: tombol hapus (ikon tempat sampah merah) di samping Tinjau -> AlertDialog konfirmasi (Batal / Ya, Hapus) -> DELETE /api/admin/submissions/{id} (404 jika tidak ada) -> toast "Data berhasil dihapus", baris dihapus dari state tanpa reload, stats di-refresh. File: DeleteDialog.jsx, JournalTable.jsx, Dashboard.jsx. Diverifikasi via Playwright.

## Update (Okt 2026) — VIBESMAI v2
- Rebrand ke VIBESMAI, tema gelap modern (Unbounded/Manrope, aksen lime). Dashboard di /admin (/dashboard & /login redirect). Login tampil inline di /admin.
- Skema baru: video_link, created_at, status pending|processing|draft|final|failed, ai_score, ai_letter_grade, ai_strengths, ai_weaknesses (+ rubrik), final_score/final_grade (edit guru). Migrasi otomatis data lama saat startup.
- AI: system prompt persis dari guru; metadata (judul, caption, hashtag, mention) dikirim ke gemini-3.1-pro-preview; link privat -> teks "Data gagal diekstrak karena privasi link." dikirim ke AI, hasil dipaksa skor 0 / grade D / pesan privasi.
- Dashboard: kolom Nama, Kelas, Absen, Link, Status, Skor AI, Letter Grade, Aksi (Edit + Hapus merah, dialog konfirmasi teks persis). Edit sheet: embed video (YT/TikTok/IG/FB), edit skor akhir/rubrik, Simpan Draft / Simpan Permanen (Final), nilai ulang AI. Bulk Final/Draft, chip distribusi per kelas, Export to CSV / Excel (semua / per kelas).
- /results tetap ada (toggle guru) — hanya menampilkan nilai berstatus Final.
- Tested iteration_2: backend 33/33, frontend flows pass.

## Update (Okt 2026) — Komentar AI untuk Siswa
- Field student_feedback + feedback_status (generating|ready|failed). Gemini menulis 2–3 kalimat hangat (Bahasa Indonesia, menyapa nama depan, 1 kelebihan + 1 saran, tanpa menyebut AI/privasi/skor, tidak mengarang isi video).
- Otomatis dibuat (latar belakang) saat Simpan Permanen (Final) bila kosong; tombol "Buat ulang dengan AI" (POST /api/admin/submissions/{id}/feedback, async + polling UI); guru bisa edit. Bulk Final juga membuat komentar.
- Tampil di /results bersama Nilai Final (hanya status final). Kolom ekspor "Komentar untuk Siswa".
- Antrean AI global (PriorityLock, 1 permintaan serentak, retry/backoff); aksi guru diprioritaskan di atas penilaian latar belakang. Memperbaiki kegagalan penilaian saat banyak siswa mengirim bersamaan.
- Tested iteration_4: 9/9 feedback + 34/34 regression, UI pass.
