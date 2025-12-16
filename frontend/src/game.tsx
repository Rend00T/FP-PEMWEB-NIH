import background from "./assets/bg.png";
import boxImg from "./assets/box.png";
import papan1 from "./assets/papanlvl1.png";
import papan2 from "./assets/papanlvl2.png";
import papan3 from "./assets/papanlvl3.png";
import papan4 from "./assets/papanlvl4.png";
import papan5 from "./assets/papanlvl5.png";
import wagonImg from "./assets/wagon.png";
import trainImg from "./assets/train.png";
import balloonImg from "./assets/balloon.png";
import explodeImg from "./assets/bahlil.png";
import Balloon from "./components/Balloon";
import TrainWithWagons from "./components/TrainWithWagons";
import PauseButton from "./components/PauseButton";
import ExitButton from "./components/ExitButton";
import { useGameLogic } from "./gameLogic";
import GameOverCard from "./components/GameOverCard";
import VictoryCard from "./components/VictoryCard";
import Cloud from "./components/Cloud";
import { useEffect, useRef, useState } from "react";

interface GameProps {
  exitGame: () => void;
  gameId?: string;
}

export default function Game({ exitGame, gameId }: GameProps) {
  const {
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
    restartLevel,
  } = useGameLogic({ exitGame, gameId });

  // Papan level (bergerak per level)
  const boardTargetLeft = 0; // transform target (left offset sudah di style: left: 80)
  const boardOffLeft = -600; // mulai jauh di kiri
  const boardOffRight =
    typeof window !== "undefined" ? window.innerWidth + 600 : 1600; // keluar ke kanan
  const [boardX, setBoardX] = useState(boardOffLeft);
  const [boardSrc, setBoardSrc] = useState(papan1);
  const prevLevel = useRef<number | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const getBoardByLevel = (lvl: number) => {
    if (lvl === 1) return papan1;
    if (lvl === 2) return papan2;
    if (lvl === 3) return papan3;
    if (lvl === 4) return papan4;
    return papan5;
  };

  useEffect(() => {
    const nextSrc = getBoardByLevel(level);
    const hasPrev = prevLevel.current !== null;

    if (hasPrev) {
      // 1) Keluarkan papan lama ke kanan (smooth)
      setBoardX(boardOffRight);
      // 2) Setelah benar-benar keluar (durasi keluarnya 3s), ganti papan lalu masuk dari kiri
      setTimeout(() => {
        setBoardSrc(nextSrc);
        setBoardX(boardOffLeft);
        requestAnimationFrame(() => {
          setBoardX(boardTargetLeft);
        });
      }, 3000);
    } else {
      // Level pertama: langsung masuk dari kiri
      setBoardSrc(nextSrc);
      setBoardX(boardOffLeft);
      requestAnimationFrame(() => {
        setBoardX(boardTargetLeft);
      });
    }

    prevLevel.current = level;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // Preload seluruh asset gambar penting (bg, papan, balon, kereta, wagon, box, ledakan)
  useEffect(() => {
    const assets = [
      background,
      boxImg,
      papan1,
      papan2,
      papan3,
      papan4,
      papan5,
      wagonImg,
      trainImg,
      balloonImg,
      explodeImg,
    ];

    let cancelled = false;
    const loadImage = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // tetap lanjut meski gagal
        img.src = src;
      });

    Promise.all(assets.map(loadImage)).then(() => {
      if (!cancelled) setImagesLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const ready = !loading && imagesLoaded;

  if (!ready) {
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

      {/* BOARD LEVEL */}
      <img
        src={boardSrc}
        style={{
          position: "absolute",
          top: 600,
          left: 80,
          transform: `translateX(${boardX}px)`,
          height: 230,
          objectFit: "contain",
          transition: "transform 3s ease-in-out",
          willChange: "transform",
          zIndex: 12,
          pointerEvents: "none",
        }}
      />

      {/* CLOUDS */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Cloud
          key={i}
          delayMs={i * 700}
          durationMs={16000 + i * 2000}
          scale={0.6 + (i % 3) * 0.2}
          y={10 + (i % 3) * 28}
        />
      ))}

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
            width: 64,
            height: 64,
            left: f.x - 32,
            // Batasi posisi bawah agar tidak menembus gambar wagon (wagon bottom ~ 40, tinggi ~120)
            top: Math.min(f.y, window.innerHeight - 170), // 140 = 40 (bottom wagon) + ~100 (tinggi wagon)
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <img
            src={boxImg}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "relative",
              color: "white",
              fontWeight: 800,
              fontSize: 28,
              textShadow: "0 0 4px rgba(0,0,0,0.8)",
            }}
          >
            {f.value}
          </div>
        </div>
      ))}

      {/* TRAIN & WAGONS */}
      <TrainWithWagons x={trainX} count={level} level={level} />

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

      {gameOver && (
        <GameOverCard
          onRetry={restartLevel}
          onExit={handleExit}
        />
      )}

      {victory && (
        <VictoryCard onExit={handleExit} />
      )}
    </div>
  );
}
