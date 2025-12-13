// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// Types
export interface GamePlayData {
  id: string;
  name: string;
  description: string | null;
  thumbnail_image: string;
  max_value: number;
  levels: number;
  is_published: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

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
    const res = await fetch(`${API_BASE_URL}/api/game/balloons?${params.toString()}`);
    if (!res.ok) throw new Error("bad response");
    const response = (await res.json()) as ApiResponse<{ values: number[] }>;
    return response.data.values;
  } catch {
    // fallback
    return Array.from({ length: count }).map(
      () => Math.floor(Math.random() * maxValue) + 1
    );
  }
}

// Get game play data (public) dari backend
export async function getGamePlayPublic(gameId: string): Promise<GamePlayData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/game/game-type/counting-dots/${gameId}/play/public`);
    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const response = (await res.json()) as ApiResponse<GamePlayData>;
    return response.data;
  } catch {
    return null;
  }
}

// Get all public games (untuk memilih game)
export async function getAllPublicGames(gameTypeSlug?: string) {
  try {
    const params = new URLSearchParams();
    if (gameTypeSlug) {
      params.append("gameTypeSlug", gameTypeSlug);
    }
    const res = await fetch(`${API_BASE_URL}/api/game?${params.toString()}`);
    if (!res.ok) throw new Error("bad response");
    const response = (await res.json()) as ApiResponse<{
      data: Array<{
        id: string;
        name: string;
        description: string | null;
        thumbnail_image: string;
        total_played: number;
        game_template_slug: string;
      }>;
      meta: {
        page: number;
        perPage: number;
        total: number;
        totalPage: number;
      };
    }>;
    return response.data;
  } catch {
    return { data: [], meta: { page: 1, perPage: 10, total: 0, totalPage: 0 } };
  }
}

// POST playcount dengan game_id yang benar
export async function updatePlayCount(gameId?: string, gameSlug?: string): Promise<void> {
  try {
    const body: { game_id?: string; game?: string } = {};
    if (gameId) {
      body.game_id = gameId;
    } else if (gameSlug) {
      body.game = gameSlug;
    } else {
      // Fallback ke template slug
      body.game = "counting-dots";
    }

    await fetch(`${API_BASE_URL}/api/game/play-count`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // Silent fail - tidak perlu log error untuk play count
  } catch {
    // Silent fail
  }
}

// Legacy function untuk backward compatibility
export async function postPlayCount() {
  await updatePlayCount(undefined, "counting-dots");
}
