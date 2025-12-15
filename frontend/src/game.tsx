import { useEffect, useRef, useState } from "react";
import background from "./assets/bg.png";
import Balloon from "./components/Balloon";
import Train from "./components/Train";
import Wagon from "./components/Wagon";
import PauseButton from "./components/PauseButton";
import ExitButton from "./components/ExitButton";
import type { BalloonModel, FallingBox } from "./types/game";
import { getGamePlayPublic, updatePlayCount, type GamePlayData } from "./services/api";

interface GameProps {
  exitGame: () => void;
  gameId?: string;
}

export default function Game({ exitGame, gameId }: GameProps) {
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GamePlayData | null>(null);

  const [balloons, setBalloons] = useState<BalloonModel[]>([]);
  const [falling, setFalling] = useState<FallingBox[]>([]);
  const [hitsPerWagon, setHitsPerWagon] = useState<number[]>([]);

  const [trainX, setTrainX] = useState(() => window.innerWidth + 400);
  const trainPhase = useRef<"enter" | "idle" | "exit">("enter");
  const levelCompleted = useRef(false);
  const [levelPhase, setLevelPhase] = useState<"playing" | "completing">("playing");

  // Get levels from gameData, dengan fallback default
  const maxLevels = gameData?.levels ?? 5;

  // Hitung kecepatan balon berdasarkan level
  // Level 1: 2.0 (lambat), Level 2: 2.5, Level 3: 3.0, dst (meningkat 0.5 per level)
  // Maksimal kecepatan: 6.0
  const balloonSpeed = Math.min(2.0 + (level - 1) * 0.5, 6.0);

  // Fetch game data dari backend saat component mount
  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        // Jika tidak ada gameId, gunakan default values dan langsung mulai game
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getGamePlayPublic(gameId);
      
      if (data) {
        setGameData(data);
      }
      // Jika game tidak ditemukan, tetap lanjutkan dengan default values (silent)
      setLoading(false);
    };

    fetchGameData();
  }, [gameId]);

  // Spawn balloons setiap level
  // Fixed: Pastikan semua angka dari 1 sampai level ada di balon
  useEffect(() => {
    if (loading) return; // Tunggu sampai game data loaded

    const spawn = async () => {
      // Generate balon yang lebih banyak dan pastikan semua angka yang dibutuhkan ada
      // Minimal 3 balon per angka yang dibutuhkan, plus variasi random
      const minBalloonsPerNumber = 3;
      const extraRandom = 5; // Tambahan untuk variasi

      // Generate values yang memastikan semua angka dari 1 sampai level ada
      const values: number[] = [];
      
      // Pastikan setiap angka dari 1 sampai level ada minimal 3 kali
      for (let num = 1; num <= level; num++) {
        for (let i = 0; i < minBalloonsPerNumber; i++) {
          values.push(num);
        }
      }
      
      // Tambahkan angka random untuk variasi (dari 1 sampai level)
      for (let i = 0; i < extraRandom; i++) {
        values.push(Math.floor(Math.random() * level) + 1);
      }
      
      // Shuffle array untuk distribusi yang lebih acak
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }

      let arr: BalloonModel[] = [];

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

        // RANDOM DELAY AGAR TIDAK PER-KLOTER
        const delay = 400 + Math.random() * 600;
        setTimeout(() => spawnOne(i + 1), delay);
      };

      setBalloons([]);
      spawnOne(0);

      // reset lainnya
      setFalling([]);
      setHitsPerWagon(Array(level).fill(0));
      setTimeLeft(60);
      trainPhase.current = "enter";
      setTrainX(window.innerWidth + 400);
      // allow next level completion to be detected again
      levelCompleted.current = false;
      setLevelPhase("playing");
    };

    spawn();
  }, [level, loading]);



  // Timer
  useEffect(() => {
    if (paused) return;
    if (timeLeft <= 0) return;

    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [paused, timeLeft]);

  // Kalah jika waktu habis
  useEffect(() => {
    if (timeLeft === 0) {
      alert("Waktu habis! Level diulang.");
      setLevel((l) => l);
    }
  }, [timeLeft]);

  // Gerak kereta
  useEffect(() => {
    let raf: number;
    const step = () => {
      setTrainX((prev) => {
        // Adjust center position based on level to prevent wagons from crowding right edge
        const baseCenter = window.innerWidth / 2 - 200;
        const levelOffset = (level - 1) * 50; // Reduced shift to 50px per additional wagon to prevent off-screen
        const center = Math.max(baseCenter - levelOffset, 50); // Ensure center doesn't go too far left

        if (trainPhase.current === "enter") {
          if (prev > center) return prev - 4;
          trainPhase.current = "idle";
          return center;
        }

        if (trainPhase.current === "exit") {
          if (prev > -500) return prev - 4;
        }

        return prev;
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [level]); // Add level dependency to recalculate center on level change

  // Falling boxes movement
  useEffect(() => {
    let raf: number;

    const tick = () => {
      if (!paused) {
        setFalling((prev) =>
          prev
            .map((b) => {
              const gravity = (b.velocity ?? 0) + 0.4; // gravitasi
              return {
                ...b,
                velocity: gravity,
                y: b.y + gravity,
              };
            })
            .filter((b) => b.y < window.innerHeight - 140)
        );
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  // Collision boxes → wagons
  // Logika sesuai Wordwall: Balon HARUS memiliki angka yang SAMA PERSIS dengan angka di gerbong
  // Gerbong 1 HANYA menerima balon dengan angka 1, Gerbong 2 HANYA menerima balon dengan angka 2, dst
  useEffect(() => {
    if (falling.length === 0) return;
    // Prevent collision updates after level completion to avoid re-triggering
    if (levelCompleted.current || levelPhase === "completing") return;

    const wagonTop = window.innerHeight - 220;
    const wagonBottom = window.innerHeight - 140;

    setFalling((prev) => {
      const remain: FallingBox[] = [];
      const updatedHits = [...hitsPerWagon];

      prev.forEach((box) => {
        // Jika masih di atas gerbong, lanjutkan jatuh
        if (box.y < wagonTop) {
          remain.push(box);
          return;
        }

        // Jika sudah melewati gerbong (di bawah), hapus
        if (box.y > wagonBottom) {
          return;
        }

        // Jika jatuh di area wagon vertikal, cek value
        // Balon masuk ke wagon yang value-nya cocok, tanpa peduli posisi x
        if (box.value <= level) {
          // Value valid, hit wagon yang sesuai (wagon idx = value - 1)
          const wagonIdx = box.value - 1;
          updatedHits[wagonIdx] = Math.max(updatedHits[wagonIdx] + 1, 1);
          // Balon dihapus karena masuk wagon
        } else {
          // Value tidak valid (lebih dari level), jatuh terus
          remain.push(box);
        }
      });

      setHitsPerWagon(updatedHits);
      return remain;
    });
  }, [falling, hitsPerWagon, level, trainX]);

  // Check level completion
  useEffect(() => {
    if (hitsPerWagon.length === 0) return;
    const allFilled = hitsPerWagon.every((h) => h >= 1);
    if (allFilled) {
      // Prevent multiple triggers while waiting for transition
      if (levelCompleted.current) return;
      levelCompleted.current = true;
      setLevelPhase("completing");

      // Check jika sudah mencapai max levels
      if (level >= maxLevels) {
        // Game selesai
        alert(`Selamat! Anda telah menyelesaikan semua ${maxLevels} level!`);
        // Update play count saat game selesai
        if (gameId) {
          updatePlayCount(gameId);
        }
        exitGame();
        return;
      }

      trainPhase.current = "exit";
      setTimeout(() => {
        setLevel((l) => l + 1);
      }, 2000);
    }
  }, [hitsPerWagon, maxLevels, gameId, exitGame, levelPhase]);

  const handleDrop = (
    id: number,
    x: number,
    y: number,
    value: number
  ) => {
    setFalling((prev) => [...prev, { id, x, y, value }]);
  };

  const handleExit = () => {
    // Update play count saat exit
    if (gameId) {
      updatePlayCount(gameId);
    }
    exitGame();
  };

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          fontSize: 24,
        }}
      >
        Loading game...
      </div>
    );
  }

  // Error state (hanya tampilkan jika ada error yang critical)
  // Jika game tidak ditemukan, tetap lanjutkan dengan default values

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* HUD */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          display: "flex",
          gap: 8,
          alignItems: "center",
          zIndex: 20,
          color: "white",
          fontWeight: 600,
        }}
      >
        <div
          style={{
            padding: "4px 10px",
            background: "rgba(0,0,0,0.45)",
            borderRadius: 6,
          }}
        >
          Level {level}/{maxLevels} | Time {timeLeft}s
        </div>

        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} />
        <ExitButton onExit={handleExit} />
      </div>

      {/* BALLOONS */}
      {balloons.map((b) => (
        <Balloon
          key={b.id}
          id={b.id}
          value={b.value}
          paused={paused}
          speed={balloonSpeed}
          onDrop={handleDrop}
        />
      ))}

      {/* FALLING BOXES (DIBUAT RAPIH & PUSATNYA PAS) */}
      {falling.map((f) => (
        <div
          key={`${f.id}-${f.y}`}
          style={{
            position: "absolute",
            width: 48,
            height: 48,
            background: "black",
            border: "2px solid black",
            borderRadius: 6,
            left: f.x - 24,
            top: f.y,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: 700,
            fontSize: 20,
            zIndex: 50,
          }}
        >
          {f.value}
        </div>
      ))}

      {/* TRAIN & WAGONS */}
      <Train x={trainX} />
      <Wagon baseX={trainX} count={level} />

      {/* RAIL LINE (TIDAK MERUSAK APAPUN) */}
      <div
        style={{
          position: "absolute",
          bottom: 35,
          width: "100%",
          height: 6,
          background: "#444",
          zIndex: 10,
        }}
      ></div>
    </div>
  );
}
