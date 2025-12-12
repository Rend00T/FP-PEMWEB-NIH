import { useState } from "react";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";

export default function App() {
  const [route, setRoute] = useState<"home" | "game">("home");

  return (
    <>
      {route === "home" && (
        <HomePage
          startGame={() => setRoute("game")}
        />
      )}
      {route === "game" && (
        <GamePage
          exitGame={() => setRoute("home")}
        />
      )}
    </>
  );
}
