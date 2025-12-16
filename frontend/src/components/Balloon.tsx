import { useEffect, useRef, useState } from "react";
import balloonImg from "../assets/balloon.png";
import explodeImg from "../assets/bahlil.png";
import { soundManager } from "../soundConfig";

interface BalloonProps {
  id: number;
  value: number;
  paused: boolean;
  speed: number; // Kecepatan balon berdasarkan level
  onDrop: (id: number, x: number, y: number, value: number) => void;
}

export default function Balloon({
  id,
  value,
  paused,
  speed,
  onDrop,
}: BalloonProps) {
  const spawnX = () =>
    window.innerWidth + 300 + Math.random() * 800; // lebih jauh & renggang
  const spawnY = () => 60 + Math.random() * 200;

  const [x, setX] = useState(spawnX);
  const [y, setY] = useState(spawnY);
  const [visible, setVisible] = useState(true); // balon bisa “pecah”
  const [exploding, setExploding] = useState(false); // efek ledakan cepat
  const rafRef = useRef<number | null>(null);
  const injectedCss = useRef(false);
  

  useEffect(() => {
    // Inject keyframes untuk animasi pop (sekali saja)
    if (!injectedCss.current && typeof document !== "undefined") {
      const styleId = "balloon-pop-ease-style";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = `
          @keyframes balloon-pop-ease {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 0.9; }
          }
        `;
        document.head.appendChild(style);
      }
      injectedCss.current = true;
    }

    const tick = () => {
      if (!paused && visible) {
        setX((prev) => {
          // Jika balon menyentuh area bawah (sekitar wagon/train), respawn
          const balloonBottom = y + 130; // tinggi balon ~130
          const threshold = window.innerHeight - 105; // batas bawah yang diinginkan
          if (balloonBottom >= threshold) {
            setY(spawnY());
            return spawnX();
          }

          if (prev < -150) {
            // Jika keluar layar kiri, respawn di kanan dengan posisi baru
            setY(spawnY());
            return spawnX();
          }
          return prev - speed;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  // Sertakan y karena dipakai di hit-test bottom wagon/train
  }, [paused, visible, speed, y]);

  const handleClick = () => {
    if (!visible) return;
    // BALON PECAH: sembunyikan balon, tampilkan efek ledakan
    setVisible(false);
    setExploding(true);
    soundManager.playPop();
    onDrop(id, x + 70, y + 80, value);

    // Respawn balon baru setelah beberapa saat
    setTimeout(() => {
      setX(spawnX());
      setY(spawnY());
      setVisible(true);
      setExploding(false);
    }, 180); // efek pop in–out sangat cepat
  };

  if (!visible && !exploding) return null;

  return (
    <div
      onClick={handleClick}
      style={{
        position: "absolute",
        width: 160,
        height: 130,
        left: x,
        top: y,
        cursor: "pointer",
        userSelect: "none",
        pointerEvents: exploding ? "none" : "auto",
      }}
    >
      {exploding ? (
        <img
          src={explodeImg}
          style={{
            // Ukuran 50% dari balon, di tengah (pop kecil & cepat)
            width: "70%",
            height: "70%",
            objectFit: "contain",
            animation: "balloon-pop-ease 0.19s ease-in-out forwards",
          }}
        />
      ) : (
        <>
          <img
            src={balloonImg}
            style={{
              width: "125%",
              height: "125%",
              objectFit: "contain",
            }}
          />

          {/* Kotak angka */}
          <div
            style={{
              position: "absolute",
              top: 90,
              left: 75,
              width: 50,
              height: 100,
              borderRadius: 8,
              display: "flex",
              color: "#ffff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: "bold",
              zIndex: 60,
            }}
          >
            {value}
          </div>
        </>
      )}
    </div>
  );
}
