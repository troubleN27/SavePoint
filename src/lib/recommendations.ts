import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { Game } from "@prisma/client";
import { db } from "./db";
import { findGameByTitle, hasRawg } from "./rawg";
import { getEntries, genresOf, type Entry } from "./stats";
import { STATUS_META, type GameStatus } from "./constants";
import { parseList } from "./utils";

export type Recommendation = {
  title: string;
  reason: string;
  gameId: string | null;
  coverUrl: string | null;
  genres: string[];
  platforms: string[];
  releaseYear: number | null;
};

export type RecommendationResult = {
  source: "ai" | "algo";
  provider?: "gemini" | "claude";
  createdAt: string;
  items: Recommendation[];
  note?: string;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const COUNT = 8;

const toRec = (g: Game, reason: string): Recommendation => ({
  title: g.title,
  reason,
  gameId: g.id,
  coverUrl: g.coverUrl,
  genres: parseList(g.genres),
  platforms: parseList(g.platforms),
  releaseYear: g.releaseYear,
});

// ---------- Алгоритмический фолбэк: контентная фильтрация по жанрам ----------

function genreAffinity(entries: Entry[]) {
  const aff = new Map<string, number>();
  for (const e of entries) {
    // Оценка выше 5.5 тянет жанр вверх, ниже — вниз; «хочу пройти» — слабый плюс, «бросил» — минус
    const w = e.rating ? e.rating - 5.5 : e.status === "WANT" ? 0.5 : e.status === "DROPPED" ? -1.5 : 0.3;
    for (const g of genresOf(e)) aff.set(g, (aff.get(g) ?? 0) + w);
  }
  return aff;
}

async function scoredCandidates(entries: Entry[], limit: number) {
  const owned = new Set(entries.map((e) => e.gameId));
  const aff = genreAffinity(entries);
  const platforms = new Set(entries.map((e) => e.platformPlayed).filter(Boolean) as string[]);
  const catalog = await db.game.findMany({ take: 2000 });

  return catalog
    .filter((g) => !owned.has(g.id))
    .map((g) => {
      const genres = parseList(g.genres);
      const score =
        genres.reduce((s, x) => s + (aff.get(x) ?? 0), 0) / Math.sqrt(Math.max(1, genres.length)) +
        (parseList(g.platforms).some((p) => platforms.has(p)) ? 1 : 0) +
        (g.releaseYear && g.releaseYear >= 2018 ? 0.5 : 0);
      return { game: g, score, genres };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function algorithmic(entries: Entry[]): Promise<Recommendation[]> {
  const loved = entries.filter((e) => (e.rating ?? 0) >= 8);
  const picks = await scoredCandidates(entries, COUNT);
  return picks.map(({ game, genres }) => {
    // Ищем любимые игры с максимальным пересечением жанров
    const similar = loved
      .map((e) => ({ e, shared: genresOf(e).filter((g) => genres.includes(g)) }))
      .filter((x) => x.shared.length)
      .sort((a, b) => b.shared.length - a.shared.length || (b.e.rating ?? 0) - (a.e.rating ?? 0))
      .slice(0, 2);
    const shared = [...new Set(similar.flatMap((x) => x.shared))].slice(0, 3);
    const reason = similar.length
      ? `Тебе понравились ${similar.map((x) => `«${x.e.game.title}» (${x.e.rating}/10)`).join(" и ")}. Общее: ${shared.join(", ")}.`
      : `Тебе нравятся жанры ${genres.slice(0, 2).join(" и ")} — эта игра из той же лиги.`;
    return toRec(game, reason);
  });
}

// ---------- AI: общий промпт и схема ответа ----------

const RecSchema = z.object({
  recommendations: z
    .array(
      z.object({
        title: z.string().describe("Точное официальное название игры (латиницей, как в магазинах)"),
        reason: z.string().describe("1–2 предложения на русском: почему именно этому игроку"),
      }),
    )
    .describe(`Ровно ${COUNT} игр`),
});
type AiPicks = z.infer<typeof RecSchema>["recommendations"];

const SYSTEM_PROMPT =
  "Ты — куратор игр в сервисе SavePoint. По коллекции игрока предложи, что пройти следующим. " +
  "Учитывай высокие оценки и отзывы, избегай того, что похоже на брошенные и низко оценённые игры. " +
  "Не предлагай игры, которые уже есть в коллекции. Пиши причины на русском, лично и конкретно, ссылаясь на игры игрока.";

function describeLibrary(entries: Entry[]) {
  const line = (e: Entry) =>
    `- ${e.game.title} (${e.game.releaseYear ?? "?"}; ${genresOf(e).join(", ")}) — ${STATUS_META[e.status as GameStatus].label}` +
    (e.rating ? `, оценка ${e.rating}/10` : "") +
    (e.hoursPlayed ? `, ${e.hoursPlayed} ч` : "") +
    (e.review ? `. Отзыв: «${e.review.slice(0, 200)}»` : "");
  const byRating = [...entries].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return byRating.slice(0, 60).map(line).join("\n");
}

async function buildUserPrompt(entries: Entry[]) {
  // Без RAWG ограничиваем выбор локальным каталогом, чтобы у рекомендаций были обложки и данные
  const candidates = hasRawg() ? [] : await scoredCandidates(entries, 80);
  const candidateBlock = candidates.length
    ? `\n\nВыбирай ТОЛЬКО из этого списка доступных игр:\n${candidates.map((c) => `- ${c.game.title}`).join("\n")}`
    : "";
  return `Коллекция игрока:\n${describeLibrary(entries)}${candidateBlock}\n\nПредложи ${COUNT} игр.`;
}

/** Сопоставляет названия от модели с каталогом и отбрасывает то, что уже есть в коллекции. */
async function resolvePicks(entries: Entry[], picks: AiPicks): Promise<Recommendation[]> {
  const owned = new Set(entries.map((e) => e.game.title.toLowerCase()));
  const items: Recommendation[] = [];
  for (const r of picks) {
    if (owned.has(r.title.toLowerCase())) continue;
    const game = await findGameByTitle(r.title);
    if (game && entries.some((e) => e.gameId === game.id)) continue;
    items.push(
      game
        ? toRec(game, r.reason)
        : { title: r.title, reason: r.reason, gameId: null, coverUrl: null, genres: [], platforms: [], releaseYear: null },
    );
  }
  return items.slice(0, COUNT);
}

// ---------- Gemini ----------

export const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";

async function withGemini(entries: Entry[]): Promise<AiPicks> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL,
    contents: await buildUserPrompt(entries),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(RecSchema),
    },
  });
  if (!response.text) {
    throw new Error(`Gemini returned no text (finishReason=${response.candidates?.[0]?.finishReason})`);
  }
  return RecSchema.parse(JSON.parse(response.text)).recommendations;
}

// ---------- Claude ----------

async function withClaude(entries: Entry[]): Promise<AiPicks> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(RecSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: await buildUserPrompt(entries) }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Claude returned no recommendations (stop_reason=${response.stop_reason})`);
  }
  return response.parsed_output.recommendations;
}

// ---------- Выбор провайдера ----------

type Provider = { name: "gemini" | "claude"; run: (entries: Entry[]) => Promise<AiPicks> };

/** Gemini в приоритете; Claude — если задан только его ключ. */
function aiProvider(): Provider | null {
  if (process.env.GEMINI_API_KEY) return { name: "gemini", run: withGemini };
  if (process.env.ANTHROPIC_API_KEY) return { name: "claude", run: withClaude };
  return null;
}

function logAiError(provider: string, error: unknown) {
  if (error instanceof ApiError) console.error(`[ai:${provider}] API error ${error.status}:`, error.message);
  else if (error instanceof Anthropic.AuthenticationError) console.error(`[ai:${provider}] invalid ANTHROPIC_API_KEY`);
  else if (error instanceof Anthropic.RateLimitError) console.error(`[ai:${provider}] rate limited`);
  else if (error instanceof Anthropic.APIError) console.error(`[ai:${provider}] API error ${error.status}:`, error.message);
  else console.error(`[ai:${provider}]`, error);
}

export async function getRecommendations(userId: string, { refresh = false } = {}): Promise<RecommendationResult> {
  if (!refresh) {
    const cached = await db.recommendationCache.findUnique({ where: { userId } });
    if (cached && Date.now() - cached.createdAt.getTime() < CACHE_TTL_MS) {
      const payload = JSON.parse(cached.payload) as RecommendationResult;
      // Подборка была собрана алгоритмом, пока AI-ключа не было, а теперь он есть — пересобираем
      const aiJustEnabled = payload.source === "algo" && !payload.note && aiProvider() !== null;
      if (!aiJustEnabled) return payload;
    }
  }

  const entries = await getEntries(userId);
  const provider = aiProvider();
  const now = () => new Date().toISOString();
  let result: RecommendationResult;

  if (entries.filter((e) => e.rating).length < 3) {
    result = {
      source: "algo",
      createdAt: now(),
      items: await algorithmic(entries),
      note: "Оцени хотя бы 3 игры — рекомендации станут точнее.",
    };
  } else if (provider) {
    try {
      const picks = await provider.run(entries);
      result = { source: "ai", provider: provider.name, createdAt: now(), items: await resolvePicks(entries, picks) };
    } catch (error) {
      logAiError(provider.name, error);
      result = {
        source: "algo",
        createdAt: now(),
        items: await algorithmic(entries),
        note: "AI временно недоступен — показываем подборку по твоим жанрам.",
      };
    }
  } else {
    result = { source: "algo", createdAt: now(), items: await algorithmic(entries) };
  }

  const payload = JSON.stringify(result);
  await db.recommendationCache.upsert({
    where: { userId },
    update: { payload, source: result.source, createdAt: new Date() },
    create: { userId, payload, source: result.source },
  });
  return result;
}
