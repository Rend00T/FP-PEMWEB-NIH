import { useEffect, useRef, useState } from "react";
import balloonImg from "../assets/balloon.png";

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
  const [x, setX] = useState(() => window.innerWidth + 200 + Math.random() * 400);
  const [y] = useState(() => 80 + Math.random() * 160);
  const [visible, setVisible] = useState(true);   // ← balon bisa “pecah”
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      if (!paused && visible) {
        setX((prev) => {
          if (prev < -150) {
            return window.innerWidth + Math.random() * 400;
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
  }, [paused, visible, speed]);

  const handleClick = () => {
    if (!visible) return;
    setVisible(false); // BALON PECAH
    onDrop(id, x + 70, y + 80, value);
  };

  if (!visible) return null;

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
      }}
    >
      <img
        src={balloonImg}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      {/* Kotak angka */}
      <div
          style={{
          position: "absolute",
          top: 30,
          left: 55,
          width: 50,
          height: 50,
          background: "black",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: "bold",
          zIndex: 50,
          }}
        > 
        {value}
      </div>

    </div>
  );
}
