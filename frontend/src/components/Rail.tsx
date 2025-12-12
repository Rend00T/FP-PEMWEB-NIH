export default function Rail() {
  return (
    <div
      className="absolute bottom-10 w-full"
      style={{
        height: "8px",
        background: "#444",
      }}
    >
      {/* sleeper kayu */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute bg-yellow-800"
          style={{
            width: "30px",
            height: "12px",
            left: i * 70,
            bottom: -6,
          }}
        ></div>
      ))}
    </div>
  );
}
