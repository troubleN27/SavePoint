/** Нормализация жанров и платформ из RAWG к русским/коротким названиям. */
const GENRE_MAP: Record<string, string> = {
  action: "Экшен",
  adventure: "Приключения",
  "role-playing-games-rpg": "RPG",
  shooter: "Шутер",
  strategy: "Стратегия",
  indie: "Инди",
  puzzle: "Головоломка",
  platformer: "Платформер",
  racing: "Гонки",
  sports: "Спорт",
  simulation: "Симулятор",
  fighting: "Файтинг",
  arcade: "Аркада",
  casual: "Казуальная",
  family: "Семейная",
  "massively-multiplayer": "MMO",
  "board-games": "Настольная",
  card: "Карточная",
  educational: "Обучающая",
};

const TAG_GENRES: Record<string, string> = {
  horror: "Хоррор",
  "survival-horror": "Хоррор",
  "psychological-horror": "Хоррор",
  roguelike: "Рогалик",
  "souls-like": "Соулслайк",
  metroidvania: "Метроидвания",
  "open-world": "Открытый мир",
};

export function normalizeGenres(genres: { slug: string; name: string }[], tags: { slug: string }[] = []) {
  const out = new Set<string>();
  for (const g of genres) out.add(GENRE_MAP[g.slug] ?? g.name);
  for (const t of tags) if (TAG_GENRES[t.slug]) out.add(TAG_GENRES[t.slug]);
  return [...out].slice(0, 4);
}

const PLATFORM_MAP: Record<string, string> = {
  pc: "PC",
  playstation5: "PS5",
  playstation4: "PS4",
  playstation3: "PS3",
  "xbox-series-x": "Xbox Series",
  "xbox-one": "Xbox One",
  xbox360: "Xbox 360",
  "nintendo-switch": "Switch",
  macos: "Mac",
  linux: "Linux",
  ios: "iOS",
  android: "Android",
};

export function normalizePlatforms(platforms: { slug: string; name: string }[]) {
  const out = new Set<string>();
  for (const p of platforms) out.add(PLATFORM_MAP[p.slug] ?? p.name);
  return [...out].slice(0, 6);
}
