import { useEffect, useRef, useState } from "react";
import background from "./assets/background.png";
import Balloon from "./components/Balloon";
import Train from "./components/Train";
import Wagon from "./components/Wagon";
import PauseButton from "./components/PauseButton";
import ExitButton from "./components/ExitButton";
import type { BalloonModel, FallingBox } from "./types/game";
import { fetchBalloonValues } from "./services/api";

interface GameProps {
  exitGame: () => void;
}

export default function Game({ exitGame }: GameProps) {
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const [balloons, setBalloons] = useState<BalloonModel[]>([]);
  const [falling, setFalling] = useState<FallingBox[]>([]);
  const [hitsPerWagon, setHitsPerWagon] = useState<number[]>([]);

  const [trainX, setTrainX] = useState(() => window.innerWidth + 400);
  const trainPhase = useRef<"enter" | "idle" | "exit">("enter");

  // Spawn balloons setiap level
  useEffect(() => {
  const spawn = async () => {
    const count = 10;
    const values = await fetchBalloonValues(count, 10);

    let arr: BalloonModel[] = [];

    const spawnOne = (i: number) => {
      if (i >= count) {
        setBalloons(arr);
        return;
      }

      const value = values[i];

      // GELombang sinus
      const wave = Math.sin(i * 0.8) * 40;

      arr.push({
        id: i + Math.random() * 100000,
        value,
        x: window.innerWidth + 250 + Math.random() * 200,
        y: 120 + wave + Math.random() * 20,
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
  };

  spawn();
}, [level]);



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
        const center = window.innerWidth / 2 - 200;

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
  }, []);

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
  useEffect(() => {
    if (falling.length === 0) return;

    const wagonTop = window.innerHeight - 220;

    setFalling((prev) => {
      const remain: FallingBox[] = [];
      const updatedHits = [...hitsPerWagon];

      prev.forEach((box) => {
        if (box.y < wagonTop) {
          remain.push(box);
          return;
        }

        const wagonStart = trainX + 220;
        const spacing = 180;
        const rel = box.x - wagonStart;
        const idx = Math.floor(rel / spacing);

        if (idx >= 0 && idx < level) {
          const target = idx + 1;
          if (box.value === target) {
            updatedHits[idx] = Math.max(updatedHits[idx] + 1, 1);
          }
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
      trainPhase.current = "exit";
      setTimeout(() => {
        setLevel((l) => l + 1);
      }, 2000);
    }
  }, [hitsPerWagon]);

  const handleDrop = (
    id: number,
    x: number,
    y: number,
    value: number
  ) => {
    setFalling((prev) => [...prev, { id, x, y, value }]);
  };

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
          Level {level} | Time {timeLeft}s
        </div>

        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} />
        <ExitButton onExit={exitGame} />
      </div>

      {/* BALLOONS */}
      {balloons.map((b) => (
        <Balloon
          key={b.id}
          id={b.id}
          value={b.value}
          paused={paused}
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
