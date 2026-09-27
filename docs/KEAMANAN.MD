# DOKUMENTASI KEAMANAN — CONTEXT MERGER

## 1. Ringkasan

Context Merger adalah aplikasi web statis, offline-first, tanpa server, tanpa autentikasi, dan tanpa dependensi eksternal. Seluruh data disimpan di localStorage browser. Tidak ada request jaringan yang dilakukan aplikasi. Dokumen ini menjelaskan model proteksi, klasifikasi risiko, mitigasi yang sudah diterapkan, dan panduan bagi pengguna.

---

## 2. Model Proteksi

Aplikasi ini memiliki permukaan interaksi yang berbeda dari web app konvensional. Tidak ada backend, tidak ada database, tidak ada sesi, tidak ada cookie. Cakupan proteksi yang relevan dibatasi pada:

Eksekusi konten berbahaya di dalam browser pengguna (XSS atau injeksi markup).

Manipulasi data melalui file yang di-import.

Pemanfaatan halaman dalam konteks berbeda (clickjacking saat di-hosting).

Paparan data lokal karena keterbatasan penyimpanan browser.

Proteksi jaringan (CSRF, CORS, intercept data) tidak berlaku karena tidak ada komunikasi jaringan sama sekali.

---

## 3. Klasifikasi Risiko

### 3.1 Berlaku — Sudah Dilindungi

**Injeksi markup melalui konten tersimpan.** Konten Role, Context, Preset, dan file import dirender ke DOM. Sebelum pembaruan keamanan, terdapat beberapa titik yang memerlukan penyempurnaan: field emoji dan identifier di sidebar belum melalui proses escape, metadata import di modal belum melalui proses escape, dan fungsi escape pada preview belum lengkap.

Mitigasi yang diterapkan: Escape HTML lima karakter (ampersand, kurang dari, lebih dari, kutip ganda, kutip tunggal) pada semua konten pengguna sebelum disisipkan ke innerHTML. Sanitizer whitelist pasca-render pada preview Markdown yang hanya mengizinkan tag aman (paragraf, heading, list, bold, italic, kode, blockquote, tautan, garis) dan memvalidasi protokol tautan.

**Kontaminasi data melalui parsing JSON.** File JSON yang di-import bisa mengandung properti khusus yang merusak struktur objek global.

Mitigasi: Fungsi safeParse menggunakan reviver yang membuang properti khusus berbahaya saat parsing. Batas ukuran file 5 MB diterapkan sebelum proses parsing.

**Validasi data import yang tidak memadai.** Data dari file import bisa berisi objek dengan field tak terduga, tipe salah, atau nilai berlebihan.

Mitigasi: Fungsi sanitasi array memvalidasi setiap item berdasarkan whitelist field per entitas (roles, contexts, presets, templates). Panjang string dibatasi, tipe dikonversi, dan array difilter.

**Gangguan performa dari file import berukuran besar.** File berukuran ratusan megabyte bisa membuat tab browser berhenti merespons.

Mitigasi: Batas ukuran import 5 MB, batas jumlah item 1.000, dan batas panjang konten per item.

**Clickjacking saat di-hosting.** Halaman bisa disematkan dalam frame oleh situs lain.

Mitigasi: Frame-buster JavaScript di app.js yang mencoba membuka halaman di tab utama dan menyembunyikan konten jika gagal. Diperkuat dengan HTTP header X-Frame-Options DENY dan CSP frame-ancestors none saat di-hosting.

### 3.2 Tidak Berlaku

**CSRF (Cross-Site Request Forgery).** Membutuhkan server yang memproses state melalui cookie atau form submission. Aplikasi ini tidak memiliki server, cookie, atau sesi.

**CORS (Cross-Origin Resource Sharing).** Membutuhkan request HTTP ke origin lain. Aplikasi ini tidak melakukan request ke origin manapun.

**RCE (Remote Code Execution).** Browser sandbox mencegah eksekusi kode di level sistem operasi. Setara RCE di konteks web app adalah XSS dan kontaminasi objek — sudah diklasifikasikan sebagai Berlaku di atas.

**SQL Injection.** Tidak ada database SQL. Penyimpanan menggunakan localStorage.

**Session Hijacking.** Tidak ada sesi atau autentikasi yang bisa dicuri.

**Intersepsi data jaringan (Man-in-the-Middle).** Tidak ada data yang ditransmisikan melalui jaringan.

**SSRF (Server-Side Request Forgery).** Tidak ada kode server-side.

### 3.3 Di-Mitigasi — Sudah Punya Dasar, Perlu Kesadaran Pengguna

**Kompromi dependensi (supply chain).** Aplikasi zero-dependency — tidak ada paket eksternal, tidak ada CDN, tidak ada analytics. Kebijakan ini harus dipertahankan. Jika suatu saat menambahkan resource eksternal, gunakan Subresource Integrity (SRI).

**Data berbahaya melalui file import.** File yang di-import berasal dari luar aplikasi. Pengguna diminta hanya mengimpor file dari sumber terpercaya. Aplikasi sudah melakukan sanitasi data, namun konten yang ditujukan untuk memengaruhi respons AI yang menerima output merge berada di luar kendali aplikasi ini.

**Paparan data di localStorage.** localStorage bukan penyimpanan terenkripsi. Siapa pun yang punya akses fisik ke perangkat atau profil browser bisa membaca data. Belum ada mekanisme enkripsi yang diterapkan saat ini.

**Penggunaan tampilan untuk menyesatkan (UI redressing via CSS).** File CSS sudah diaudit dan dinyatakan bersih: tidak ada impor eksternal, tidak ada referensi URL ke sumber luar, tidak ada kode eksekusi, dan hierarki z-index pada overlay konsisten.

---

## 4. Perlindungan yang Sudah Diterapkan

### 4.1 Content Security Policy (CSP)

CSP dipasang sebagai meta tag di index.html dengan pengaturan berikut:

default-src none — blokir semua resource secara default.

script-src self — hanya izinkan script dari file lokal.

style-src self — hanya izinkan CSS dari file lokal.

img-src self data blob — izinkan gambar lokal dan data URI.

connect-src none — blokir semua network request.

object-src none — blokir plugin eksternal.

frame-src none — blokir penyematan frame.

base-uri none — cegah manipulasi base URL.

form-action none — blokir pengiriman form.

worker-src none — blokir web worker.

Catatan: frame-ancestors tidak bisa diatur via meta tag. Saat hosting, tambahkan sebagai HTTP header.

### 4.2 HTTP Security Headers (Saat Hosting)

Header berikut tidak bisa dikirim melalui meta tag dan harus diatur di konfigurasi server atau platform hosting:

X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), clipboard-write=(self)
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Content-Security-Policy: sama seperti meta tag, tambahkan frame-ancestors none

### 4.3 Sanitasi Konten

Escape HTML lima karakter pada semua konten pengguna yang dirender ke DOM. Whitelist tag sanitizer pasca-render pada preview Markdown. Validasi protokol tautan (hanya http, https, anchor, mailto). Attribute rel noopener noreferrer dan target blank pada semua tautan hasil render.

### 4.4 Keamanan Import

Batas ukuran file 5 MB. Batas jumlah item 1.000. Anti kontaminasi objek global melalui reviver pada parsing JSON. Whitelist field per entitas. Validasi tipe data: string dipotong, array difilter, angka divalidasi.

### 4.5 Keamanan Penyimpanan

Guard pada fungsi pembacaan: hanya terima array of plain objects. Whitelist pada fungsi update dan bulkUpsert: hanya field yang diizinkan yang bisa diubah. Validasi di level repository: tipe, panjang, dan format setiap field.

### 4.6 Keamanan DOM

Tidak ada eval, new Function, atau dynamic script loading. Tidak ada script src eksternal. Tidak ada javascript URL. Inline style di HTML telah dipindah ke CSS class. Frame-buster JavaScript untuk perlindungan clickjacking.

---

## 5. Panduan Keamanan untuk Pengguna

### Yang Aplikasi Ini Lindungi

Data kamu tidak dikirim ke server manapun. Konten yang dirender sudah disanitasi. File import sudah divalidasi terhadap data berbahaya. Tidak ada dependensi eksternal yang bisa dikompromikan. CSP membatasi resource yang bisa dimuat halaman.

### Yang Harus Kamu Jaga

Perangkat dan profil browser kamu. Siapa pun yang punya akses bisa membaca data di localStorage. File yang kamu import. Hanya impor file dari sumber terpercaya. Kredensial dan data sensitif. Jangan simpan API key, password, atau token di dalam Context. Backup data. Export JSON secara berkala. Tanpa backup, data hilang berarti hilang permanen.

### Yang Berada di Luar Kendali Aplikasi Ini

Konten yang akan kamu paste ke AI. Jika output merge berisi instruksi tersembunyi yang dirancang untuk memengaruhi respons AI, itu tanggung jawabmu untuk memeriksa sebelum paste. Keamanan platform AI yang menerima kontenmu. Setiap platform memiliki kebijakan dan sistem keamanannya sendiri. Keamanan jaringan jika kamu hosting aplikasi ini. Gunakan HTTPS.

---

## 6. Melaporkan Kerentanan

Jika menemukan celah keamanan di Context Merger: buka issue di repository GitHub atau kontak langsung melalui email jika bersifat sensitif. Sertakan deskripsi masalah, langkah reproduksi, dan versi aplikasi. Jangan mempublikasikan detail pemanfaatan sebelum diperbaiki.

---

## 7. Catatan Teknis

**Teknologi:** Vanilla HTML, CSS, JavaScript. Nol dependensi, nol build tools, nol server.

**Penyimpanan:** localStorage dengan prefix cs_. Kapasitas tipikal 5 sampai 10 MB per origin tergantung browser.

**Enkripsi:** Belum diterapkan. Data disimpan dalam bentuk plain JSON di localStorage. Enkripsi passphrase menggunakan WebCrypto (PBKDF2 + AES-GCM) direncanakan sebagai fitur opsional di versi mendatang.

**Audit:** Dilakukan terhadap 12 file JavaScript, 1 file HTML, dan 5 file CSS. Terdapat 6 temuan kritis dan 5 temuan sedang yang seluruhnya sudah di-patch. File CSS dinyatakan bersih setelah checklist audit.