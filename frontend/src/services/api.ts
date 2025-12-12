// Ambil angka-angka balon dari backend lokal.
// Jika backend mati / error, fallback ke angka random di frontend.
export async function fetchBalloonValues(
  count: number,
  maxValue: number
): Promise<number[]> {
  try {
    const params = new URLSearchParams({
      count: String(count),
      max: String(maxValue),
    });
    const res = await fetch(`http://localhost:4000/api/game/balloons?${params.toString()}`);
    if (!res.ok) throw new Error("bad response");
    const response = (await res.json()) as { 
      success: boolean;
      statusCode: number;
      message: string;
      data: { values: number[] };
    };
    return response.data.values;
  } catch {
    // fallback
    return Array.from({ length: count }).map(
      () => Math.floor(Math.random() * maxValue) + 1
    );
  }
}

// POST playcount saat Exit ditekan
export async function postPlayCount() {
  try {
    await fetch("http://localhost:4000/api/game/play-count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "counting-dots" }),
    });
  } catch (err) {
    console.warn("Gagal POST playcount (diabaikan di dev):", err);
  }
}
