import Train from "./Train";
import Wagon from "./Wagon";

interface TrainWithWagonsProps {
  x: number;
  count: number;
  level: number;
}

/**
 * Wrapper untuk menampilkan kereta + seluruh wagon sebagai satu grup,
 * dan menggeser sedikit ke kiri tiap naik level agar muat di layar.
 */
export default function TrainWithWagons({ x, count, level }: TrainWithWagonsProps) {
  const perLevelShift = 30; // geser ke kiri 40px per level
  const adjustedX = x - (level - 1) * perLevelShift;

  return (
    <>
      <Train x={adjustedX} />
      <Wagon baseX={adjustedX} count={count} />
    </>
  );
}


