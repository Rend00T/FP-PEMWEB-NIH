import wagonImg from "../assets/wagon.png";

interface WagonProps {
  baseX: number;
  count: number;
}

export default function Wagon({ baseX, count }: WagonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        // posisi kiri wagon (selaras dengan kereta)
        const x = baseX + 300 + i * 180;

        return (
          <div key={i}>
            {/* ANGKA DI TENGAH WAGON */}
            <div
              style={{
                position: "absolute",
                bottom: 80,       // TENGAH wagon
                left: x + 65,      // pas tengah horizontal
                width: 50,
                height: 50,
                background: "black",
                borderRadius: 8,
                fontSize: 26,
                fontWeight: "bold",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 0 6px rgba(0,0,0,0.5)",
                zIndex: 30
              }}
            >
              {i + 1}
            </div>

            {/* GAMBAR WAGON */}
            <img
              src={wagonImg}
              style={{
                position: "absolute",
                bottom: 40,
                left: x,
                height: 120,
                pointerEvents: "none",
                animation: "waggle 1.3s infinite ease-in-out",
                zIndex: 20
              }}
            />
          </div>
        );
      })}
    </>
  );
}
