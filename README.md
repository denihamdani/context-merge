# Context Merger

**Gabungkan konteks AI. Satu paste. Nol keribetan.**
Aplikasi web offline-first untuk vibe coder yang pakai AI gratis.
Buka di desktop, tablet, atau mobile.

---

![Status](https://img.shields.io/badge/status-v0.1.0-blue) ![Lisensi](https://img.shields.io/badge/license-MIT-green) ![Dependensi](https://img.shields.io/badge/dependencies-0-brightgreen) ![Offline](https://img.shields.io/badge/offline-first-orange)

---

<img width="1863" height="945" alt="Screenshot_20260926_114917" src="https://github.com/user-attachments/assets/211d4e67-08d2-4ed6-b586-ea21a7f89452" />


## ✨ Fitur

| Fitur                        | Deskripsi                                                      |
| ---------------------------- | -------------------------------------------------------------- |
| **📁 Manajer Role & Konteks** | Simpan persona AI dan bahan referensi dalam format markdown    |
| **🧩 Sistem Preset**          | Simpan kombinasi favoritmu untuk dipakai ulang secara instan   |
| **🔀 Merge Engine**           | Gabungkan beberapa item jadi satu blok siap paste              |
| **📊 Sadar Token**            | Estimasi token real-time dengan bar anggaran berwarna          |
| **🎨 Sistem Template**        | 3 format output bawaan (Markdown, XML, Compact)                |
| **📋 Copy Sekali Klik**       | Salin hasil merge langsung ke clipboard                        |
| **⬇️ Export/Import**          | Backup JSON dengan checksum, export Markdown, import drag-drop |
| **⌨️ Keyboard-First**         | Navigasi keyboard penuh + shortcut                             |
| **📱 Responsive**             | Desktop, tablet, dan mobile dalam satu aplikasi                |
| **🌙 Dark Mode**              | UI gelap eksklusif, nyaman di mata                             |
| **📴 Offline-First**          | Nol server. Nol cloud. Nol auth. Jalan tanpa internet.         |

---

## 🚀 Cara Mulai

### Opsi 1: Clone & Buka

```bash
git clone https://github.com/denihamdai/context-merge.git
cd context-merge
# Buka index.html di browser kamu
```

### Opsi 2: Langsung File

1. Download repo sebagai ZIP
2. Ekstrak di mana aja
3. Double-click `index.html`

> **Syarat:** Browser modern (Chrome, Edge, Firefox, Safari). Mendukung desktop (≥1024px), tablet (768–1023px), dan mobile (<768px).

---

## ⌨️ Keyboard Shortcut

### Global

| Shortcut       | Aksi                                |
| -------------- | ----------------------------------- |
| `Alt+N`        | Role Baru                           |
| `Alt+K`        | Konteks Baru                        |
| `Alt+C`        | Copy hasil merge                    |
| `Alt+I`        | Import JSON                         |
| `Alt+D`        | Download .md                        |
| `Ctrl+Shift+E` | Export JSON                         |
| `Ctrl+F`       | Fokus ke pencarian                  |
| `Ctrl+P`       | Ganti mode preview (raw / rendered) |
| `Ctrl+/`       | Bantuan shortcut                    |
| `Esc`          | Tutup modal / batal                 |

### Navigasi & Editing

| Shortcut                        | Aksi                              |
| ------------------------------- | --------------------------------- |
| `↑` / `↓`                       | Pindah antar item                 |
| `Enter`                         | Buka / Edit item terpilih         |
| `Ctrl+Enter`                    | Copy konten item terpilih         |
| `Ctrl+Shift+M`                  | Tambah item terpilih ke merge     |
| `Ctrl+S`                        | Simpan (di dalam modal)           |
| `Ctrl+Shift+↑` / `Ctrl+Shift+↓` | Pindahkan item merge naik / turun |
| `Delete` / `Backspace`          | Hapus item terpilih               |

> Tekan `Ctrl+/` di aplikasi untuk lihat shortcut kapan saja.

---

## 👆 Touch Gestures (Mobile & Tablet)

| Gestur                  | Aksi                              |
| ----------------------- | --------------------------------- |
| Tap item                | Pilih item                        |
| Tap **⋮**               | Buka action sheet                 |
| Long-press (Android)    | Buka action sheet                 |
| Double-tap preset       | Konfirmasi lalu load preset       |
| Tap **▲ / ▼**           | Pindahkan item merge naik / turun |
| Tap overlay / ✕ / Batal | Tutup modal / action sheet        |

---

## 🏗️ Tech Stack

| Layer          | Pilihan                  | Alasan                                 |
| -------------- | ------------------------ | -------------------------------------- |
| **Frontend**   | Vanilla HTML + CSS + JS  | Nol dependensi, nol build tools        |
| **Styling**    | CSS Custom Properties    | Design tokens, responsive, dark mode   |
| **Storage**    | localStorage (pluggable) | Offline, instan, tanpa setup           |
| **Events**     | Custom pub/sub EventBus  | Modul yang tidak saling ketergantungan |
| **Distribusi** | File statis              | Buka di browser mana pun, tanpa server |

### Arsitektur

```
index.html
├── css/
│   ├── variables.css      ← Design tokens
│   ├── base.css           ← Reset, tipografi, reduced-motion
│   ├── layout.css         ← Grid layout, breakpoint responsif
│   ├── components.css     ← Tombol, input, modal, touch targets
│   └── panels.css         ← Sidebar, merge, preview, tab bar
└── js/
    ├── core.js            ← EventBus, konstanta, generator ID
    ├── storage.js         ← Registry adapter storage
    ├── repository.js      ← Logika CRUD per entitas
    ├── merge.js           ← Merge engine + estimasi token
    ├── ui-sidebar.js      ← Rendering sidebar + long-press
    ├── ui-merge.js        ← Workspace merge + seleksi item
    ├── ui-preview.js      ← Panel preview
    ├── ui-modal.js        ← Modal, toast, action sheet
    ├── ui-shortcuts.js    ← Handler keyboard + touch tracking
    ├── utils.js           ← Export, import, clipboard
    └── app.js             ← Titik masuk + responsive controller
```

---

## 📊 Estimasi Token

Context Merge memakai algoritma **estimasi token hybrid**:

| Tipe Konten            | Rumus          | Akurasi |
| ---------------------- | -------------- | ------- |
| Banyak kode (>30%)     | `karakter / 3` | ±20%    |
| Banyak teks (<5% kode) | `kata × 1.3`   | ±20%    |
| Campuran               | `karakter / 4` | ±20%    |

### Bar Anggaran

| Status         | Rentang | Warna   |
| -------------- | ------- | ------- |
| 🟢 Aman         | 0–50%   | Hijau   |
| 🟡 Hati-hati    | 50–80%  | Kuning  |
| 🔴 Hampir Penuh | 80–100% | Merah   |
| ⚫ Kelebihan    | >100%   | Abu-abu |

Anggaran default: **8.000 token** (sesuai batas ChatGPT gratis).

## 📦 Export / Import

### Export

- **Backup JSON** — Semua data + checksum SHA-256 + versi schema
- **Markdown** — Hasil merge sebagai file `.md`
- **Clipboard** — Copy langsung dengan fallback

### Import

- **File JSON** — Restore penuh dengan validasi + auto-migration
- **File Markdown** — Import batch via drag & drop
- **Paste dari clipboard** — Paste markdown mentah

---