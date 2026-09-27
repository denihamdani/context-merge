# PANDUAN APLIKASI — CONTEXT MERGER

## 1. Mulai Cepat

Buka index.html di browser apa pun. Aplikasi langsung jalan tanpa instalasi, tanpa server, tanpa akun.

**Langkah 1 — Buat Role.** Klik tombol + New di panel Roles atau tekan Alt+N. Isi judul, emoji, dan konten persona AI kamu. Contoh: "Kamu adalah senior Go developer dengan 10 tahun pengalaman di distributed system." Simpan.

**Langkah 2 — Buat Context.** Klik tombol + New di panel Context atau tekan Alt+K. Isi bahan referensi — bisa spesifikasi proyek, dokumentasi API, aturan coding, dan lainnya.

**Langkah 3 — Gabungkan.** Pilih item dari sidebar, klik kanan lalu pilih Add to Merge (atau Ctrl+Shift+M). Atur urutan di panel Merge. Tekan Copy All (Alt+C). Tempel hasilnya ke ChatGPT, Claude, atau AI apa pun. Selesai.

---

## 2. Konsep Dasar

**Role** — Persona yang kamu berikan ke AI. Instruksi sistem yang mendefinisikan karakter AI saat menjawab, misalnya "Kamu adalah code reviewer yang teliti dan kritis." Setiap interaksi AI biasanya membutuhkan tepat satu Role.

**Context** — Bahan referensi yang dilampirkan ke AI. Bisa berupa spesifikasi, kode program, dokumentasi API, aturan tim, daftar bug, dan sebagainya. Boleh lebih dari satu Context per interaksi. Konten disimpan dalam format Markdown.

**Preset** — Kombinasi tersimpan dari beberapa Role dan Context yang sering dipakai bersama. Contoh: preset "Code Review Setup" berisi 1 Role senior reviewer plus 2 Context berisi style guide dan diff pull request saat ini. Dengan satu klik, seluruh kombinasi langsung dimuat ke Merge Workspace.

Hubungan ketiganya: Role mendefinisikan siapa AI-nya, Context memberikan apa yang diketahui AI-nya, dan Preset menyimpan kombinasi favorit agar tidak perlu memilih ulang setiap kali.

---

## 3. Alur Kerja Vibe Coding

**Resep 1 — Mulai proyek baru.** Buat Role "Senior Architect" plus Context berisi deskripsi proyek dan constraint teknis, lalu Context berisi stack yang dipakai. Simpan sebagai Preset. Setiap kali mulai sesi baru, load Preset, sesuaikan Context sesuai kebutuhan, lalu copy.

**Resep 2 — Debugging.** Context berisi pesan error lengkap, kode yang bermasalah, dan konteks environment. Role-nya: "Debugging expert yang teliti dan memberikan solusi lengkap dengan penjelasan." Merge lalu copy.

**Resep 3 — Refactoring.** Context berisi kode lama, aturan coding tim, dan deskripsi target arsitektur baru. Role-nya: "Senior engineer yang melakukan refactoring bertahap dengan menjaga backward compatibility."

**Resep 4 — Dokumentasi.** Context berisi kode yang perlu didokumentasikan. Role-nya: "Technical writer yang membuat dokumentasi API lengkap dengan contoh request dan response."

**Tips:** Simpan Role yang sudah jadi sebagai reusable asset. Pisahkan Context per topik (misal "Style Guide Go", "API Spec v2", "Bug Report 123"). Simpan Preset untuk alur kerja yang rutin.

---

## 4. Merge Engine

Merge Engine menggabungkan semua item yang dipilih di Merge Workspace menjadi satu blok teks siap digunakan.

Urutan output mengikuti urutan item di panel Merge. Ubah urutan dengan tombol panah atas bawah atau Ctrl+Shift+panah atas bawah.

**Tiga format output (template):**

**Markdown Header (default).** Setiap Role diawali header "## ROLE: nama", setiap Context diawali "## CONTEXT: nama", dipisahkan garis horizontal. Paling mudah dibaca manusia.

**XML Tags.** Setiap Role dibungkus tag role, setiap Context dibungkus tag context, keseluruhan dibungkus tag system. Berguna untuk AI yang memahami struktur terstruktur seperti Claude.

**Compact.** Format padat tanpa whitespace berlebih. Setiap item hanya punya header satu baris dalam kurung siku. Cocok untuk menghemat token.

**Kapan pakai mana:** Default ke Markdown Header. Pakai XML Tags jika AI merespons lebih baik dengan struktur terstruktur. Pakai Compact jika mendekati batas token dan perlu menyisipkan konten sebanyak mungkin.

---

## 5. Estimasi Token

Aplikasi menggunakan algoritma estimasi token hybrid Level 3 yang menyesuaikan berdasarkan jenis konten.

Konten yang didominasi kode (lebih dari 30 persen karakter kode): diestimasi dengan membagi jumlah karakter dengan 3. Akurasi plus minus 20 persen.

Konten yang didominasi teks biasa (kurang dari 5 persen karakter kode): diestimasi dengan mengalikan jumlah kata dengan 1,3. Akurasi plus minus 20 persen.

Konten campuran: diestimasi dengan membagi jumlah karakter dengan 4. Akurasi plus minus 20 persen.

**Bar anggaran** di panel Merge menunjukkan posisi token saat ini relatif terhadap budget (default 8.000 token, sesuai batas ChatGPT gratis):

Hijau (0 sampai 50 persen) — aman, masih banyak ruang.

Kuning (50 sampai 80 persen) — mulai mempertimbangkan pemangkasan konten.

Merah (80 sampai 100 persen) — hampir mencapai batas, potong konten yang kurang penting.

Abu-abu (lebih dari 100 persen) — melebihi batas, output mungkin dipotong oleh AI.

**Catatan:** Estimasi ini perkiraan, bukan angka pasti. Beri buffer 10 sampai 15 persen dari batas maksimal AI yang digunakan.

---

## 6. Export dan Import

**Export JSON (Ctrl+Shift+E).** Menghasilkan file backup .json yang berisi semua data (Roles, Contexts, Presets, Templates) beserta metadata dan versi schema. Digunakan untuk backup atau migrasi ke perangkat lain.

**Export Markdown (Alt+D).** Mengunduh hasil merge saat ini sebagai file .md. Berguna untuk menyimpan output ke dokumentasi proyek.

**Export ke Clipboard (Alt+C).** Menyalin hasil merge langsung ke clipboard. Jika clipboard API tidak tersedia, aplikasi menampilkan pesan untuk mengunduh sebagai file .md.

**Import JSON.** Melalui tombol Import di header (Alt+I) atau drag-and-drop file .json ke area aplikasi. Saat import, tersedia dua mode: Merge (data lama tetap ada, item baru ditambahkan berdasarkan ID) dan Replace (seluruh data saat ini diganti dengan data dari file).

**Import Markdown.** Drag-and-drop file .md ke area aplikasi. File diimpor sebagai Context baru. Judul diambil dari heading pertama atau dari nama file.

**Tips backup:** Export JSON secara berkala, terutama setelah menambah banyak konten. Simpan file backup di cloud storage untuk redundansi.

---

## 7. Keyboard Shortcut

**Global:** Alt+N untuk Role baru. Alt+K untuk Context baru. Alt+C untuk copy hasil merge. Alt+I untuk import JSON. Alt+D untuk unduh .md. Ctrl+Shift+E untuk export JSON. Ctrl+F untuk fokus pencarian. Ctrl+P untuk ganti mode preview. Ctrl+/ untuk panel bantuan. Esc untuk tutup modal.

**Navigasi dan Editing:** Panah atas bawah untuk pindah antar item. Enter untuk buka atau edit item terpilih. Ctrl+Enter untuk copy konten item terpilih. Ctrl+Shift+M untuk tambah item ke Merge. Delete atau Backspace untuk hapus item terpilih.

**Panel Merge:** Ctrl+Shift+panah atas untuk pindahkan ke atas. Ctrl+Shift+panah bawah untuk pindahkan ke bawah.

**Modal Edit:** Ctrl+S untuk simpan perubahan.

---

## 8. Touch Gestures (Mobile dan Tablet)

**Tap item** — Pilih item. **Tap tombol titik tiga** — Buka action sheet. **Long-press (Android)** — Buka context menu, durasi sekitar 0,6 detik. **Double-tap preset** — Konfirmasi dua kali sebelum memuat. **Tap panah atas bawah** — Ubah urutan item di merge. **Tap overlay atau tombol tutup** — Tutup modal atau action sheet.

Catatan iOS: Long-press tidak aktif mengikuti kebijakan platform. Gunakan tombol titik tiga untuk membuka menu aksi.

---

## 9. Tampilan Responsive

**Desktop (1024px ke atas):** Sidebar, Merge Workspace, dan Preview Panel tampil berdampingan.

**Tablet (768 sampai 1023px):** Sidebar menjadi drawer yang bisa dibuka dan ditutup. Merge dan Preview berdampingan.

**Mobile (di bawah 768px):** Semua panel diakses melalui tab bar di bawah: Items, Merge, Preview.

**Mode preview:** Raw menampilkan output merge sebagai teks mentah. Rendered merender Markdown menjadi HTML dengan heading, bold, italic, code block, dan list.

---

## 10. Tanya Jawab

**Data saya disimpan di mana?** Seluruh data tersimpan di localStorage browser pada perangkat kamu. Tidak dikirim ke server mana pun, tidak ada cloud sync, tidak ada akun.

**Kenapa tidak ada akun?** Aplikasi dirancang offline-first. Semua data lokal. Tidak ada server yang perlu mengenali pengguna.

**Bisa sinkron antar perangkat?** Tidak otomatis. Gunakan Export JSON di satu perangkat, lalu Import JSON di perangkat lain.

**Apakah aman menyimpan API key di Context?** Tidak disarankan. localStorage bukan penyimpanan terenkripsi. Gunakan password manager dan hanya tempel saat diperlukan.

**Kenapa estimasi token tidak selalu akurat?** Algoritma berbasis heuristik. Akurasi plus minus 20 persen sudah memadai untuk perencanaan. Beri buffer 10 sampai 15 persen.

**Bagaimana menghapus semua data?** Buka Developer Tools browser (F12), masuk ke Application, lalu Local Storage, hapus semua key yang diawali cs_. Atau gunakan mode Replace saat import dengan file JSON kosong.

**Bisa dipakai offline?** Ya. Setelah index.html terbuka, semua fitur berjalan tanpa internet. Tidak ada request jaringan.

---

## 11. Keamanan dan Privasi

Ringkasan singkat: Aplikasi ini tidak mengirim data ke mana pun. Proteksi utama adalah sanitasi konten yang dirender dan validasi data import. Detail lengkap ada di dokumen keamanan terpisah.

Yang perlu kamu ketahui: Data kamu hanya ada di perangkat ini. Siapa pun yang punya akses ke perangkat atau profil browser bisa membaca data tersebut. Impor file dari sumber terpercaya saja. Jangan simpan kredensial atau data sensitif di dalam Context. Backup secara berkala dengan Export JSON.

---

