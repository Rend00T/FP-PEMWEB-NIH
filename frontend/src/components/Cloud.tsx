import { useEffect, useRef } from "react";

interface CloudProps {
  delayMs: number;
  durationMs: number;
  scale: number;
  y: number;
  paused?: boolean;
}

/**
 * SVG awan sederhana yang bergerak dari kiri ke kanan dengan animasi halus.
 * Gunakan beberapa instance dengan delay/scale berbeda untuk kesan acak.
 */
export default function Cloud({ delayMs, durationMs, scale, y, paused }: CloudProps) {
  const injected = useRef(false);

  // Inject keyframes sekali
  useEffect(() => {
    if (injected.current || typeof document === "undefined") return;
    const id = "cloud-move-keyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
        @keyframes cloud-move {
          0% { transform: translateX(-20vw); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(120vw); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    injected.current = true;
  }, []);

  return (
    <svg
      width={400 * scale}
      height={100 * scale}
      viewBox="0 0 200 80"
      style={{
        position: "absolute",
        top: y,
        left: 0,
        opacity: 0.9,
        animation: `cloud-move ${durationMs}ms linear infinite`,
        animationDelay: `${delayMs}ms`,
        animationPlayState: paused ? "paused" : "running",
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.08))",
        pointerEvents: "none",
        zIndex: 5,
      }}
      fill="none"
    >
      <path
        d="M50 60c-15 0-25-10-25-23 0-9 6-17 14-20 2-10 12-17 24-17 9 0 17 4 21 10 3-2 8-3 12-3 12 0 22 8 22 18 0 1 0 2-0.1 3C128 27 138 32 138 42c0 10-10 18-22 18H50Z"
        fill="url(#cloudGrad1)"
      />
      <defs>
        <linearGradient id="cloudGrad1" x1="40" y1="0" x2="160" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="1" stopColor="#e5e7eb" stopOpacity="0.92" />
        </linearGradient>
      </defs>
    </svg>
  );
}


