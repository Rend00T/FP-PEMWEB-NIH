import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";

export default function App() {
  const [route, setRoute] = useState<"home" | "game">("home");
  const [gameId, setGameId] = useState<string | undefined>(undefined);

  // Check URL parameters untuk gameId (untuk integrasi dengan WordIT)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("gameId");
    if (id) {
      setGameId(id);
      setRoute("game");
    }
  }, []);

  return (
    <>
      {route === "home" && (
        <HomePage
          startGame={(id?: string) => {
            if (id) setGameId(id);
            setRoute("game");
          }}
        />
      )}
      {route === "game" && (
        <GamePage
          exitGame={() => setRoute("home")}
          gameId={gameId}
        />
      )}
    </>
  );
}
