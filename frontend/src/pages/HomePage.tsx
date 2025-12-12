interface HomePageProps {
  startGame: () => void;
}

export default function HomePage({ startGame }: HomePageProps) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        background: "#0f172a",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: 32, margin: 0 }}>Counting Dots Game</h1>
      <button
        onClick={startGame}
        style={{
          padding: "10px 24px",
          borderRadius: 8,
          border: "none",
          background: "#22c55e",
          color: "white",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        Start Game
      </button>
    </div>
  );
}
