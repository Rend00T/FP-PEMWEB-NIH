// Konfigurasi dan utilitas manajemen suara game
// Pastikan file-file berikut ada di `src/assets/sounds/`:
// - background.ogg
// - click.ogg
// - countdown.ogg
// - fall.ogg
// - pop.ogg
// - in.ogg
// - timeup.ogg
// - success.ogg
// - train.ogg
// - gameover.ogg
// - victory.ogg

import bgmUrl from "./assets/sounds/background.ogg";
import clickUrl from "./assets/sounds/click.ogg";
import countdownUrl from "./assets/sounds/countdown.ogg";
import fallUrl from "./assets/sounds/fall.ogg";
import popUrl from "./assets/sounds/pop.ogg";
import inUrl from "./assets/sounds/in.ogg";
import timeupUrl from "./assets/sounds/timeup.ogg";
import successUrl from "./assets/sounds/success.ogg";
import trainUrl from "./assets/sounds/train.ogg";
import gameoverUrl from "./assets/sounds/gameover.ogg";
import victoryUrl from "./assets/sounds/victory.ogg";

const soundFiles = {
  background: bgmUrl,
  click: clickUrl,
  countdown: countdownUrl,
  fall: fallUrl,
  pop: popUrl,
  in: inUrl,
  timeup: timeupUrl,
  success: successUrl,
  train: trainUrl,
  gameover: gameoverUrl,
  victory: victoryUrl,
} as const;

type SoundKey = keyof typeof soundFiles;

class SoundManager {
  private audios = new Map<SoundKey, HTMLAudioElement>();
  private loaded = false;
  private lastPlay = new Map<SoundKey, number>();
  private playingCount = new Map<SoundKey, number>();
  private playingInstances = new Set<HTMLAudioElement>();

  async preloadAll() {
    if (this.loaded) return;
    const entries = Object.entries(soundFiles) as [SoundKey, string][];
    await Promise.all(entries.map(([key, url]) => this.preload(key, url)));
    this.loaded = true;
  }

  private preload(key: SoundKey, url: string) {
    return new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.addEventListener(
        "canplaythrough",
        () => resolve(),
        { once: true },
      );
      audio.addEventListener(
        "error",
        () => resolve(), // kalau gagal tetap resolve supaya game bisa jalan
        { once: true },
      );
      this.audios.set(key, audio);
    });
  }

  private getAudio(key: SoundKey): HTMLAudioElement | undefined {
    const audio = this.audios.get(key);
    if (!audio) return undefined;
    return audio;
  }

  private stop(audio: HTMLAudioElement) {
    audio.pause();
    audio.currentTime = 0;
  }

  playBackground() {
    const audio = this.getAudio("background");
    if (!audio) return;
    audio.loop = true;
    audio.currentTime = 0;
    void audio.play();
  }

  stopBackground() {
    const audio = this.getAudio("background");
    if (!audio) return;
    audio.pause();
  }

  pauseAll() {
    // Pause semua instance yang sedang bermain tanpa reset posisi
    this.playingInstances.forEach((audio) => audio.pause());
    this.audios.forEach((audio) => audio.pause());
  }

  stopAll() {
    // Hentikan semua instance yang sedang diputar (termasuk clone)
    this.playingInstances.forEach((audio) => this.stop(audio));
    this.playingInstances.clear();
    // Reset base audios juga
    this.audios.forEach((audio, key) => {
      this.stop(audio);
      if (key !== "background") audio.loop = false;
    });
    this.playingCount.clear();
  }

  playClick() {
    this.playOneShot("click");
  }

  playCountdown() {
    this.playOneShot("countdown");
  }

  playFall() {
    this.playOneShot("fall");
  }

  playPop() {
    this.playOneShot("pop");
  }

  playIn() {
    this.playOneShot("in");
  }

  playTimeup() {
    // timeup menginterupsi background
    this.stopBackground();
    this.playOneShot("timeup");
  }

  playSuccess() {
    this.playOneShot("success");
  }

  playTrain() {
    this.playOneShot("train");
  }

  playGameOver() {
    this.stopAll();
    this.playOneShot("gameover");
  }

  playVictory() {
    this.stopAll();
    this.playOneShot("victory");
  }

  resumeBackground() {
    const audio = this.getAudio("background");
    if (!audio) return;
    audio.loop = true;
    void audio.play();
  }

  private playOneShot(key: SoundKey) {
    const now = performance.now();
    const last = this.lastPlay.get(key) ?? 0;
    // Hindari chorus/phase: tahan jika terlalu cepat berturut-turut
    if (now - last < 80) return;
    this.lastPlay.set(key, now);

    // Batasi overlap berlebih: maksimal 2 instance per sound
    const current = this.playingCount.get(key) ?? 0;
    if (current >= 2) return;

    const base = this.getAudio(key);
    if (!base) return;

    // Gunakan base untuk tipe "background", clone untuk efek lain
    const audio = key === "background" ? base : (base.cloneNode(true) as HTMLAudioElement);
    if (key !== "background") audio.loop = false;

    this.playingCount.set(key, current + 1);
    const cleanup = () => {
      const val = this.playingCount.get(key) ?? 1;
      this.playingCount.set(key, Math.max(0, val - 1));
      audio.removeEventListener("ended", cleanup);
      audio.removeEventListener("error", cleanup);
      this.playingInstances.delete(audio);
    };
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    audio.currentTime = 0;
    this.playingInstances.add(audio);
    void audio.play().catch(cleanup);
  }
}

export const soundManager = new SoundManager();


