# Counting Dots (Frontend)

Repositori ini berisi frontend game edukasi "Counting Dots". Dokumen ini dibagi menjadi beberapa bagian:

1) Dokumentasi proyek (alur build/run, struktur, asset)
2) Mekanika dan logika game
3) Implementasi & strategi (teknis utama)

---

## 1) Dokumentasi Proyek

### Teknologi
- React + Vite (TypeScript)
- Custom hooks untuk logika game (`useGameLogic`)
- Vite asset handling untuk gambar & audio

### Jalankan secara lokal
```bash
cd frontend
npm install
npm run dev
# build prod
npm run build
```

### Struktur berkas utama
- `src/game.tsx` — root scene game (UI, cloud, papan level, train+wagon, kotak jatuh)
- `src/gameLogic.ts` — hook pusat logika game (state, timer, collision, transisi level, audio)
- `src/soundConfig.ts` — manajer audio (preload, limit overlap, stopAll)
- `src/components/` — komponen UI (Balloon, Train, Wagon, Cloud, GameOver/Victory card, dll)
- `src/assets/` — gambar dan suara (papanlvl1-5, wagon, train, balloon, bahlil efek pop, box, bg, audio*)

> Pastikan semua asset audio ada di `src/assets/sounds/`:  
> `background.ogg`, `click.ogg`, `countdown.ogg`, `fall.ogg`, `pop.ogg`, `in.ogg`, `timeup.ogg`, `success.ogg`, `train.ogg`, `gameover.ogg`, `victory.ogg`.

### Loading awal
- Frontend akan **gate** tampilan sampai:
  - Data (gameId) selesai di-fetch (`loading` dari `useGameLogic`)
  - Semua gambar utama selesai dipreload (`imagesLoaded` di `game.tsx`)
  - Audio dipreload satu kali (`soundManager.preloadAll`)

---

## 2) Mekanika & Logika Game

### Tujuan
Player mem-pop balon berangka. Kotak bernilai sama akan jatuh ke wagon yang memiliki angka/dots sama. Level selesai jika setiap wagon mendapat minimal satu kotak yang tepat.

### Aturan inti
- Balon bergerak dari kanan ke kiri. Klik → balon pecah, efek ledakan, kotak jatuh.
- Kotak:
  - Jika jatuh di area wagon yang angka/dots cocok → hit tercatat, `in.ogg`.
  - Jika angka tidak cocok atau tidak mendarat di wagon/kereta → dianggap jatuh ke rel, `fall.ogg`.
  - Posisi bawah kotak dibatasi agar tidak menembus wagon.
- Train + wagon:
  - Spawn dari kanan, geser ke kiri untuk posisi idle; exit ke kiri penuh saat ganti level.
- Level selesai:
  - Semua wagon (1..level) punya minimal 1 hit.
  - Balon tersisa langsung di-pop dan spawn batch kotak sebagai transisi.
  - Jika bukan level terakhir → kereta keluar, tunggu jeda, level++.
  - Jika level terakhir → state victory, `victory.ogg`.
- Waktu habis:
  - Jika belum selesai → state game over, popup, `gameover.ogg`, semua audio stop.

### Kontrol & pause
- Tombol Pause membekukan timer, gerak kereta, balon (raf logic) dan animasi cloud (animationPlayState paused).
- Exit / Kembali → `soundManager.stopAll()` lalu keluar ke home.
- Game Over: tombol "Coba Lagi" memanggil `restartLevel` (stopAll, reset state level).

### Audio
- Background musik on/off sesuai loading & unmount.
- Overlap limiter: cooldown 80ms, maksimal 2 instance per sound; semua instance dicatat dan bisa di-stop massal.
- train.ogg diputar saat mulai level (fase enter), berhenti ketika stopAll dipanggil (exit/game over/restart/exit game).

---

## 3) Implementasi & Strategi Teknis

### State & hook utama (`useGameLogic`)
- Menyimpan: `level`, `timeLeft`, `paused`, `balloons`, `falling`, `hitsPerWagon`, `trainX`, `gameOver`, `victory`, `loading`.
- Timer 1 detik, berhenti saat pause atau timeLeft <= 0.
- Spawn balon per level: memastikan distribusi angka 1..level, plus acak tambahan.
- Collision kotak:
  - Hitbox wagon disamakan dengan area background dots (offset/width konsisten).
  - Kereta punya area sendiri; kotak yang menyentuh kereta dianggap miss.
  - Kotak di bawah top wagon → miss (fall).
- Transisi level:
  - `trainPhase`: enter → idle → exit. Exit bergerak sampai rangkaian hilang dari layar kiri.
  - Delay sebelum setLevel (5s) agar animasi exit selesai.
  - Balon tersisa dihapus, spawn batch kotak untuk efek transisi.
  - `restartTick` memaksa respawn level saat "Coba Lagi".

### Audio manager (`soundConfig`)
- Preload sekali, flag `loaded`.
- Stop semua instance (clone) + base melalui `stopAll`.
- Overlap guard: max 2 instance, min 80ms antar-play per sound.
- Background pakai base audio; efek pakai clone.

### UI & animasi
- Cloud: animated keyframes, bisa di-pause.
- Papan level: animasi masuk/keluar kiri-kanan per level dengan `translateX` ease-in-out (3s).
- Kereta/wagon: digerakkan via state `trainX`; wrapper `TrainWithWagons` menjaga alignment.
- Balon: auto-respawn jika melewati batas bawah atau pop; efek ledakan `bahlil.png`.
- Kotak jatuh: dirender dengan `box.png` + angka; posisi bawah dibatasi agar “masuk” ke wagon.

### Preload & gating
- Gambar utama dipreload (bg, box, papan1-5, wagon, train, balloon, efek pop).
- Audio dipreload di `useGameLogic` (idempotent).
- Render game hanya ketika data+audio+image siap.

### Known mitigations untuk glitch level tinggi
- Spawn posisi kereta pakai viewport helper agar tidak NaN.
- Pause-aware pada gerak kereta dan animasi cloud.
- Clear timeout level change sebelum set baru.
- stopAll dipanggil pada exit/restart untuk mencegah sound nyangkut (termasuk train.ogg).

---

## Ringkas
Game ini memusatkan logika di `useGameLogic`, dengan manajer audio yang membatasi overlap dan kemampuan stop massal. UI dirender di `game.tsx` dengan preload aset ketat sebelum game mulai. Transisi level menghapus balon tersisa, memainkan efek suara yang tepat, dan memberi waktu kereta keluar/masuk agar tetap terlihat mulus. Jika menambah level atau aset baru, pastikan offset hitbox wagon/kereta dan preload aset diperbarui agar konsisten.


