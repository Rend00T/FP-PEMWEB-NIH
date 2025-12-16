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
        bottom: 95,
        left: x,
        width: 320,
        pointerEvents: "none",
        animation: "waggle 1.2s infinite ease-in-out",
        zIndex: 100,
      }}
    />
  );
}