import Game from "../game";

interface GamePageProps {
  exitGame: () => void;
  gameId?: string;
}

export default function GamePage({ exitGame, gameId }: GamePageProps) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Game exitGame={exitGame} gameId={gameId} />
    </div>
  );
}
