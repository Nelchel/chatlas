import { Cat, Sighting } from "../types";
import { getNearbyCats } from "./nearby";
import { File } from "expo-file-system";

export interface MatchResult {
  cat: Cat;
  distance: number;
  sightingCount: number;
  similarityScore: number;
}

export interface CatMatcherProvider {
  readonly name: string;
  match(candidatePhotoUri: string, existingCat: Cat, distance: number): Promise<number>;
}

const COLOR_WEIGHTS: Record<string, number> = {
  Noir: 0.85,
  Blanc: 0.8,
  Roux: 0.85,
  Gris: 0.65,
  Tricolore: 0.9,
  Tigré: 0.55,
  Siamois: 0.9,
  Autre: 0.3,
};

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) / 0x7fffffff;
}

class MockMatcherProvider implements CatMatcherProvider {
  readonly name = "Mock (couleur + distance)";

  async match(
    _candidatePhotoUri: string,
    existingCat: Cat,
    distance: number
  ): Promise<number> {
    const colorScore = existingCat.color
      ? COLOR_WEIGHTS[existingCat.color] ?? 0.5
      : 0.2;

    const proximityScore = Math.max(0, 1 - distance / 100);

    const seed = hashId(existingCat.id);
    const deterministicFactor = 0.3 + seed * 0.7;

    return colorScore * 0.4 + proximityScore * 0.3 + deterministicFactor * 0.3;
  }
}

class OpenAiMatcherProvider implements CatMatcherProvider {
  readonly name: string;
  private baseUrl: string;

  constructor(apiKey: string, endpoint?: string) {
    this.baseUrl = (endpoint || "https://api.openai.com").replace(/\/+$/, "");
    this.name = endpoint ? "Infomaniak AI" : "OpenAI Vision";
    this.apiKey = apiKey;
  }

  private apiKey: string;

  async match(
    candidatePhotoUri: string,
    existingCat: Cat,
    _distance: number
  ): Promise<number> {
    try {
      const base64 = await this.uriToBase64(candidatePhotoUri);

      const response = await fetch(
        `${this.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: [
                  "You are a cat matching assistant. Compare the new photo against multiple reference photos to determine if they show the same cat.",
                  "Return ONLY a valid JSON object with a single field 'score' (number between 0.0 and 1.0).",
                  "1.0 = definitely the same cat, 0.0 = completely different cats.",
                  "Consider: fur pattern, colors, face shape, ear shape, eye color, distinctive markings.",
                  "Be conservative: only give >0.7 if you see clear matching features across multiple references.",
                ].join(" "),
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: [
                      `Compare this new photo with the existing cat named "${existingCat.name || "Unknown"}"`,
                      existingCat.color ? `(color: ${existingCat.color}).` : ".",
                      "Is it the same cat? Return JSON with 'score'.",
                    ].join(" "),
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${base64}`,
                      detail: "low",
                    },
                  },
                  ...(existingCat.photos || [existingCat.photo_url]).filter(Boolean).map((url) => ({
                    type: "image_url" as const,
                    image_url: { url, detail: "low" as const },
                  })),
                ],
              },
            ],
            max_tokens: 50,
            temperature: 0.1,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.warn("OpenAI API error:", response.status, err);
        return this.fallbackScore(existingCat, _distance);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      const cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      const score = Math.max(0, Math.min(1, parsed.score ?? 0.5));
      return Math.round(score * 100) / 100;
    } catch (e) {
      console.warn("OpenAI Vision failed, fallback mock:", e);
      return this.fallbackScore(existingCat, _distance);
    }
  }

  private async uriToBase64(uri: string): Promise<string> {
    const file = new File(uri);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private fallbackScore(existingCat: Cat, distance: number): number {
    const colorScore = existingCat.color
      ? COLOR_WEIGHTS[existingCat.color] ?? 0.5
      : 0.2;
    const proximityScore = Math.max(0, 1 - distance / 100);
    return Math.round((colorScore * 0.5 + proximityScore * 0.5) * 100) / 100;
  }
}

const MAX_COMPARISONS = 5;

const AI_PROVIDER = process.env.EXPO_PUBLIC_AI_MATCHER_PROVIDER || "";
const AI_API_KEY = process.env.EXPO_PUBLIC_AI_MATCHER_API_KEY || "";
const AI_ENDPOINT = process.env.EXPO_PUBLIC_AI_MATCHER_ENDPOINT || "";

let provider: CatMatcherProvider;

if ((AI_PROVIDER === "openai" || AI_PROVIDER === "infomaniak") && AI_API_KEY) {
  provider = new OpenAiMatcherProvider(AI_API_KEY, AI_ENDPOINT);
} else if (AI_PROVIDER && AI_API_KEY) {
  console.warn(
    `AI_MATCHER_PROVIDER "${AI_PROVIDER}" non reconnu — utilisation du Mock`
  );
  provider = new MockMatcherProvider();
} else {
  provider = new MockMatcherProvider();
}

export function setMatcherProvider(p: CatMatcherProvider): void {
  provider = p;
}

export function getMatcherProviderName(): string {
  return provider.name;
}

export async function findMatches(
  candidatePhotoUri: string,
  cats: Cat[],
  sightings: Sighting[],
  latitude: number,
  longitude: number,
  radiusMeters: number = 100
): Promise<MatchResult[]> {
  const nearby = getNearbyCats(cats, sightings, latitude, longitude, radiusMeters);

  const withPhoto = nearby.filter((n) => (n.cat.photos?.length ?? 0) > 0 || n.cat.photo_url).slice(0, MAX_COMPARISONS);

  const results = await Promise.all(
    withPhoto.map(async (n) => {
      const score = await provider.match(candidatePhotoUri, n.cat, n.distance);
      return { ...n, similarityScore: score };
    })
  );

  results.sort((a, b) => b.similarityScore - a.similarityScore);

  return results;
}
