import { useState, useEffect } from "react";
import { getAllPublicGames } from "../services/api";

interface HomePageProps {
  startGame: (gameId?: string) => void;
}

export default function HomePage({ startGame }: HomePageProps) {
  const [games, setGames] = useState<Array<{ id: string; name: string; thumbnail_image: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    
    const fetchGames = async () => {
      try {
        const result = await getAllPublicGames("counting-dots");
        if (isMounted && result && result.data) {
          setGames(result.data);
          // Auto-select game pertama jika ada
          if (result.data.length > 0) {
            setSelectedGameId(result.data[0].id);
          }
        }
      } catch {
        // Silent fail - akan menggunakan default game
        if (isMounted) {
          setGames([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGames();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartGame = () => {
    if (selectedGameId) {
      startGame(selectedGameId);
    } else {
      // Jika tidak ada game yang dipilih, start tanpa gameId (akan menggunakan default)
      startGame();
    }
  };

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
        padding: 20,
      }}
    >
      <h1 style={{ fontSize: 32, margin: 0 }}>Counting Dots Game</h1>
      
      {loading ? (
        <div>Loading games...</div>
      ) : games.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Pilih Game:</div>
          <select
            value={selectedGameId || ""}
            onChange={(e) => setSelectedGameId(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#1e293b",
              color: "white",
              fontSize: 16,
              minWidth: 200,
            }}
          >
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div style={{ fontSize: 14, color: "#94a3b8" }}>
          Tidak ada game yang tersedia. Game akan menggunakan pengaturan default.
        </div>
      )}

      <button
        onClick={handleStartGame}
        style={{
          padding: "10px 24px",
          borderRadius: 8,
          border: "none",
          background: "#22c55e",
          color: "white",
          cursor: "pointer",
          fontSize: 16,
          marginTop: 8,
        }}
      >
        Start Game
      </button>
    </div>
  );
}
