import wagonImg from "../assets/wagon.png";

interface WagonProps {
  baseX: number;
  count: number;
}

export default function Wagon({ baseX, count }: WagonProps) {
  const renderDots = (count: number) => {
    const dots = Array.from({ length: count });
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {dots.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "white",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        // posisi kiri wagon, disusun agar tidak overlap antar wagon
        const wagonSpacing = 300; // sedikit lebih kecil agar muat di layar
        const x = baseX + 300 + i * wagonSpacing;

        return (
          <div key={i}>
            {/* ANGKA DI TENGAH WAGON */}
            <div
              style={{
                position: "absolute",
                bottom: 93,       // TENGAH wagon
                left: x + 30,      // selaraskan di tengah wagon
                width: 280,        // lebar transparan mendekati lebar wagon
                height: 70,
                background: "rgba(0,0,0,0)",
                color: "white",
                borderRadius: 10,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                animation: "waggle 1.3s infinite ease-in-out",
                zIndex: 200
              }}
            >
              {renderDots(i + 1)}
            </div>

            {/* GAMBAR WAGON */}
            <img
              src={wagonImg}
              style={{
                position: "absolute",
                bottom: 81,
                left: x,
                height: 120,
                pointerEvents: "none",
                animation: "waggle 1.3s infinite ease-in-out",
                zIndex: 100
              }}
            />
          </div>
        );
      })}
    </>
  );
}
