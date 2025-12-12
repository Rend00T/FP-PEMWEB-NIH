import trainImg from "../assets/train.png";

interface TrainProps {
  x: number;
}

export default function Train({ x }: TrainProps) {
  return (
    <img
      src={trainImg}
      style={{
        position: "absolute",
        bottom: 40,
        left: x,
        width: 320,
        pointerEvents: "none",
        zIndex: 30,
      }}
    />
  );
}