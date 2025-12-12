import Game from "../game";

interface GamePageProps {
  exitGame: () => void;
}

export default function GamePage({ exitGame }: GamePageProps) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Game exitGame={exitGame} />
    </div>
  );
}
