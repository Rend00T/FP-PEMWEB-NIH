import { useEffect, useRef, useState } from "react";
import type { BalloonModel, FallingBox } from "./types/game";
import { soundManager } from "./soundConfig";
import {
  getGamePlayPublic,
  updatePlayCount,
  type GamePlayData,
} from "./services/api";

export interface UseGameLogicParams {
  exitGame: () => void;
  gameId?: string;
}

export interface UseGameLogicResult {
  // high-level game state
  level: number;
  maxLevels: number;
  timeLeft: number;
  gameOver: boolean;
  victory: boolean;
  paused: boolean;
  setPaused: (value: (prev: boolean) => boolean) => void;
  // entities
  balloons: BalloonModel[];
  falling: FallingBox[];
  // train / wagon
  trainX: number;
  balloonSpeed: number;
  loading: boolean;
  // handlers
  handleDrop: (id: number, x: number, y: number, value: number) => void;
  handleExit: () => void;
  restartLevel: () => void;
}

/**
 * Pusat semua logika game (state + efek + aturan).
 * Komponen UI hanya memakai hook ini tanpa menyimpan logika sendiri.
 */
export function useGameLogic({
  exitGame,
  gameId,
}: UseGameLogicParams): UseGameLogicResult {
  const getViewportWidth = () =>
    typeof window !== "undefined" ? window.innerWidth : 1920;
  const getViewportHeight = () =>
    typeof window !== "undefined" ? window.innerHeight : 1080;

  const [level, setLevel] = useState(1);
  const [paused, setPausedState] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GamePlayData | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [restartTick, setRestartTick] = useState(0);

  const [balloons, setBalloons] = useState<BalloonModel[]>([]);
  const [falling, setFalling] = useState<FallingBox[]>([]);
  const [hitsPerWagon, setHitsPerWagon] = useState<number[]>([]);

  const [trainX, setTrainX] = useState(() => getViewportWidth() + 400);
  const trainPhase = useRef<"enter" | "idle" | "exit">("enter");
  const levelCompleted = useRef(false);
  const [levelPhase, setLevelPhase] = useState<"playing" | "completing">(
    "playing",
  );
  const countdownPlayed = useRef(false);
  const levelChangeTimeout = useRef<number | null>(null);

  // Ambil jumlah level dari backend bila ada, fallback ke 5, dan batasi 1–5
  const rawMaxLevels = gameData?.levels ?? 5;
  const maxLevels = Math.min(Math.max(rawMaxLevels, 1), 5);

  const balloonSpeed = Math.min(2.0 + (level - 1) * 0.5, 6.0);

  // === DATA GAME DARI BACKEND ===
  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        setDataLoaded(true);
        return;
      }

      const data = await getGamePlayPublic(gameId);

      if (data) {
        setGameData(data);
      }
      setDataLoaded(true);
    };

    fetchGameData();
  }, [gameId]);

  // === PRELOAD AUDIO (sekali di awal) ===
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await soundManager.preloadAll();
      if (!cancelled) {
        setAudioLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // === SYNC LOADING STATE (data + audio) ===
  useEffect(() => {
    queueMicrotask(() => {
      setLoading(!(audioLoaded && dataLoaded));
    });
  }, [audioLoaded, dataLoaded]);

  // === SPAWN BALON SETIAP LEVEL ===
  useEffect(() => {
    if (loading) return;

    const spawn = async () => {
      const minBalloonsPerNumber = 3;
      const extraRandom = 5;

      const values: number[] = [];

      for (let num = 1; num <= level; num++) {
        for (let i = 0; i < minBalloonsPerNumber; i++) {
          values.push(num);
        }
      }

      for (let i = 0; i < extraRandom; i++) {
        values.push(Math.floor(Math.random() * level) + 1);
      }

      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }

      const arr: BalloonModel[] = [];

      const spawnOne = (i: number) => {
        if (i >= values.length) {
          setBalloons(arr);
          return;
        }

        const value = values[i];

        arr.push({
          id: i + Math.random() * 100000,
          value,
        });

        setBalloons([...arr]);

        const delay = 400 + Math.random() * 600;
        setTimeout(() => spawnOne(i + 1), delay);
      };

      setBalloons([]);
      spawnOne(0);

      setFalling([]);
      setHitsPerWagon(Array(level).fill(0));
      setTimeLeft(60);
      trainPhase.current = "enter";
      // Mulai dari jauh di kanan, mempertimbangkan panjang rangkaian
      const spawnOffset = level * 300 + 600;
      setTrainX(getViewportWidth() + spawnOffset);
      levelCompleted.current = false;
      setLevelPhase("playing");
      countdownPlayed.current = false;
      setGameOver(false);
      setVictory(false);

      // Mainkan suara kereta ketika level baru dimulai
      soundManager.playTrain();
    };

    spawn();
  }, [level, loading, restartTick]);

  // === BACKGROUND MUSIC ===
  useEffect(() => {
    if (loading) return;
    soundManager.playBackground();
    return () => {
      soundManager.stopBackground();
    };
  }, [loading]);

  // === TIMER ===
  useEffect(() => {
    if (paused) return;
    if (timeLeft <= 0) return;

    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [paused, timeLeft]);

  // === WAKTU HABIS ===
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (levelCompleted.current || levelPhase === "completing") return;
    if (gameOver) return;
    if (victory) return;

    queueMicrotask(() => {
      setGameOver(true);
      soundManager.playGameOver();
    });
  }, [timeLeft, levelPhase, gameOver, victory]);

  // === COUNTDOWN 10 DETIK TERAKHIR ===
  useEffect(() => {
    if (timeLeft !== 10) return;
    if (paused) return;
    if (countdownPlayed.current) return;
    countdownPlayed.current = true;
    soundManager.playCountdown();
  }, [timeLeft, paused]);

  // === GERAK KERETA ===
  useEffect(() => {
    let raf: number;
    const viewportWidth = getViewportWidth();
    const step = () => {
      setTrainX((prev) => {
        // Pusatkan kereta, lalu geser sedikit ke kiri tiap naik level
        // supaya semua gerbong muat di layar.
        const baseCenter = viewportWidth / 2 - 300;
        const perLevelShift = 125; // jarak geser ke kiri per level
        const center = Math.max(baseCenter - (level - 1) * perLevelShift, -300);

        if (trainPhase.current === "enter") {
          if (prev > center) return prev - 4;
          trainPhase.current = "idle";
          return center;
        }

        if (trainPhase.current === "exit") {
          // Gerakkan sampai seluruh rangkaian keluar layar kiri
          const exitTarget = -(level * 300 + 800);
          const exitSpeed = 10; // lebih cepat saat keluar
          if (prev > exitTarget) return prev - exitSpeed;
        }

        return prev;
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [level]);

  // === GERAK KOTAK JATUH ===
  useEffect(() => {
    let raf: number;
    const viewportHeight = getViewportHeight();

    const tick = () => {
      if (!paused) {
        setFalling((prev) =>
          prev
            .map((b) => {
              const gravity = (b.velocity ?? 0) + 0.4;
              return {
                ...b,
                velocity: gravity,
                y: b.y + gravity,
              };
            })
            // Biarkan kotak lewat sedikit di bawah wagon, supaya
            // logika miss (jatuh ke rel) bisa mendeteksi dan memutar fall.ogg.
            .filter((b) => b.y < viewportHeight - 60),
        );
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  // === KOLISI KOTAK DENGAN WAGON ===
  // Logika sesuai Wordwall: Balon HARUS memiliki angka yang SAMA PERSIS dengan angka di gerbong
  // Gerbong 1 HANYA menerima balon dengan angka 1, Gerbong 2 HANYA menerima balon dengan angka 2, dst
  useEffect(() => {
    if (falling.length === 0) return;
    // Prevent collision updates after level completion to avoid re-triggering
    if (levelCompleted.current || levelPhase === "completing") return;

    const viewportHeight = getViewportHeight();
    const wagonTop = viewportHeight - 220;
    // Posisi wagon mengikuti komponen Wagon.tsx:
    // Wagon: left = baseX + 290 + i * 300
    // Background dots: left = x + 30, width = 280
    const wagonOffsetX = 320; // 290 + 30
    const wagonSpacing = 300;
    const wagonWidth = 280; // samakan dengan lebar background dots

    // Perkiraan area kereta (Train.tsx: bottom 40, width 320, tinggi kira-kira 120)
    const trainWidth = 320;
    const trainHeight = 120;
    const trainBottom = 40;
    const trainTop = viewportHeight - (trainBottom + trainHeight);

    queueMicrotask(() => {
      setFalling((prev) => {
        let changed = false;
        const remain: FallingBox[] = [];

        setHitsPerWagon((prevHits) => {
          const updatedHits = [...prevHits];

          prev.forEach((box) => {
            const boxCenterX = box.x; // di render, kotak digambar dengan left: x - 24, width: 48

            // Jika masih di atas wagon top, lanjutkan jatuh
            if (box.y < wagonTop) {
              remain.push(box);
              return;
            }

            // Mulai deteksi ketika menyentuh top wagon/kereta:
            // 1) Cek wagon
            for (let i = 0; i < level; i++) {
              const wagonLeft = trainX + wagonOffsetX + i * wagonSpacing;
              const wagonRight = wagonLeft + wagonWidth;

              if (boxCenterX >= wagonLeft && boxCenterX <= wagonRight) {
                if (box.value === i + 1) {
                  updatedHits[i] = Math.max(updatedHits[i] + 1, 1);
                  soundManager.playIn();
                } else {
                  soundManager.playFall();
                }
                changed = true;
                return; // kotak dihapus
              }
            }

            // 2) Cek kereta
            const trainLeft = trainX;
            const trainRight = trainX + trainWidth;
            if (boxCenterX >= trainLeft && boxCenterX <= trainRight && box.y >= trainTop) {
              changed = true;
              soundManager.playFall();
              return; // kotak dihapus
            }

            // 3) Area lain di bawah top wagon → anggap jatuh ke rel, hapus
            changed = true;
            soundManager.playFall();
            return;
          });

          return updatedHits;
        });

        // Jika tidak ada perubahan (semua kotak masih di atas wagon),
        // kembalikan state lama supaya tidak memicu render berulang.
        if (!changed) return prev;
        return remain;
      });
    });
  }, [falling, level, trainX, levelPhase]);

  // === CEK KELENGKAPAN LEVEL ===
  useEffect(() => {
    if (hitsPerWagon.length === 0) return;
    const allFilled = hitsPerWagon.every((h) => h >= 1);
    if (!allFilled) return;
    // Prevent multiple triggers
    if (levelCompleted.current || levelPhase === "completing") return;
    if (gameOver) return;
    if (victory) return;
    levelCompleted.current = true;
    if (levelChangeTimeout.current) {
      clearTimeout(levelChangeTimeout.current);
    }
    // Jalankan perpindahan fase & level di microtask berikutnya
    queueMicrotask(() => {
      // Pop semua balon tersisa dan jatuhkan kotak sekaligus sebagai transisi level
      setBalloons([]);
      setFalling((prev) => {
        const drops = Array.from({ length: 6 }).map((_, idx) => ({
          id: Date.now() + idx,
          x: Math.random() * window.innerWidth,
          y: 60 + Math.random() * 80,
          value: Math.min(level, maxLevels),
        }));
        return [...prev, ...drops];
      });

      setLevelPhase("completing");

      // Check jika sudah mencapai max levels
      if (level >= maxLevels) {
        // Game selesai (victory)
        setVictory(true);
        soundManager.playVictory();
        // Update play count saat game selesai
        if (gameId) {
          updatePlayCount(gameId);
        }
        return;
      }

      // Setiap kali level selesai (dan masih lanjut), mainkan success.ogg
      soundManager.playSuccess();

      // Naik satu level saja, setelah animasi kereta keluar
      trainPhase.current = "exit";
      levelChangeTimeout.current = window.setTimeout(() => {
        setLevel((prev) => {
          // Safety: pastikan tidak melompat lebih dari +1
          const next = prev + 1;
          return next > maxLevels ? maxLevels : next;
        });
      }, 5000); // beri jeda lebih lama agar rangkaian sempat keluar layar
    });
  }, [hitsPerWagon, maxLevels, gameId, exitGame, levelPhase, level, gameOver, victory]);

  const handleDrop = (id: number, x: number, y: number, value: number) => {
    setFalling((prev) => [...prev, { id, x, y, value }]);
  };

  const handleExit = () => {
    soundManager.stopAll();
    if (gameId) {
      updatePlayCount(gameId);
    }
    exitGame();
  };

  // Expose setter yang punya API sama dengan useState boolean
  const setPaused: UseGameLogicResult["setPaused"] = (updater) => {
    setPausedState((prev) => updater(prev));
  };

  return {
    level,
    maxLevels,
    timeLeft,
    gameOver,
    victory,
    paused,
    setPaused,
    balloons,
    falling,
    trainX,
    balloonSpeed,
    loading,
    handleDrop,
    handleExit,
    restartLevel: () => setRestartTick((t) => t + 1),
  };
}


