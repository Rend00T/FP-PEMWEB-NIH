interface VictoryCardProps {
  onExit: () => void;
}

export default function VictoryCard({ onExit }: VictoryCardProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: "#111827",
          color: "white",
          padding: "24px 28px",
          borderRadius: 12,
          width: 340,
          boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Victory!</h2>
        <p style={{ margin: "0 0 20px", color: "#e5e7eb" }}>
          Semua level selesai. Kerja bagus!
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onExit}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}


