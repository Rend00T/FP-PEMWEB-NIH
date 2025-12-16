import { soundManager } from "../soundConfig";
interface PauseButtonProps {
  paused: boolean;
  onToggle: () => void;
}

export default function PauseButton({ paused, onToggle }: PauseButtonProps) {
  return (
    <button
      onClick={() => {
        soundManager.playClick();
        onToggle();
      }}
      style={{
        padding: "6px 12px",
        marginLeft: 8,
        borderRadius: 4,
        border: "1px solid #000",
        background: paused ? "#22c55e" : "#e5e7eb",
        cursor: "pointer",
      }}
    >
      {paused ? "Resume" : "Pause"}
    </button>
  );
}
