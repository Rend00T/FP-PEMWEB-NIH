import Game from "../game";

interface LevelProps {
  exitGame: () => void;
  gameId?: string;
}

export default function Level5({ exitGame, gameId }: LevelProps) {
  return <Game exitGame={exitGame} gameId={gameId} />;
}


