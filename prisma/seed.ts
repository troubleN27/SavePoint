import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_GAMES } from "../src/lib/catalog-seed";

const db = new PrismaClient();

// Демо-аккаунты для локальной разработки (пароль одинаковый, см. README)
const DEMO_PASSWORD = "savepoint";

type Entry = [slug: string, status: string, rating: number | null, hours: number | null, completed?: string, review?: string];

const PRO_LIBRARY: Entry[] = [
  ["elden-ring", "COMPLETED", 10, 142, "2025-03-14", "Лучший открытый мир, что я видел. Каждый угол прячет секрет, а Малению я буду помнить вечно."],
  ["hollow-knight", "COMPLETED", 10, 48, "2025-01-20", "Идеальная метроидвания: атмосфера, музыка, боссы."],
  ["hollow-knight-silksong", "PLAYING", 9, 21, undefined, "Хорнет быстрее и злее, сложность бодрит."],
  ["baldurs-gate-3", "COMPLETED", 10, 160, "2025-06-02", "Свобода выбора, которой больше нигде нет."],
  ["disco-elysium", "COMPLETED", 9, 34, "2025-08-11", "Литература, а не игра."],
  ["silent-hill-2", "COMPLETED", 9, 18, "2025-10-30", "Ремейк, который понял оригинал."],
  ["resident-evil-4", "COMPLETED", 9, 22, "2025-04-18"],
  ["resident-evil-2", "COMPLETED", 8, 12, "2024-10-31"],
  ["dead-space", "COMPLETED", 8, 15, "2025-11-12"],
  ["alien-isolation", "DROPPED", 6, 7, undefined, "Атмосфера топ, но чужой слишком долго ходит рядом."],
  ["signalis", "COMPLETED", 9, 11, "2026-02-02", "Survival horror в лучших традициях."],
  ["mouthwashing", "COMPLETED", 8, 3, "2026-01-15"],
  ["hades", "COMPLETED", 9, 70, "2024-12-05"],
  ["hades-ii", "PLAYING", 9, 35],
  ["celeste", "COMPLETED", 9, 14, "2025-02-09"],
  ["outer-wilds", "COMPLETED", 10, 22, "2025-09-21", "Ни одна игра так не удивляла меня открытием."],
  ["sekiro-shadows-die-twice", "DROPPED", 7, 25, undefined, "Застрял на Иссине. Вернусь когда-нибудь."],
  ["the-witcher-3-wild-hunt", "COMPLETED", 10, 120, "2024-08-15"],
  ["cyberpunk-2077", "COMPLETED", 8, 75, "2025-12-20"],
  ["red-dead-redemption-2", "PLAYING", 9, 40],
  ["clair-obscur-expedition-33", "COMPLETED", 10, 55, "2026-05-10", "Пошаговая боёвка, которая держит в напряжении."],
  ["balatro", "COMPLETED", 8, 60, "2026-03-01"],
  ["slay-the-spire", "COMPLETED", 9, 90, "2025-05-05"],
  ["stardew-valley", "DROPPED", 6, 30],
  ["god-of-war-ragnar-k", "WANT", null, null],
  ["persona-5-royal", "WANT", null, null],
  ["lies-of-p", "WANT", null, null],
  ["kingdom-come-deliverance-ii", "WANT", null, null],
  ["control", "COMPLETED", 8, 16, "2026-04-04"],
  ["doom-eternal", "COMPLETED", 8, 19, "2025-07-07"],
  ["inscryption", "COMPLETED", 9, 13, "2026-06-21"],
  ["dredge", "COMPLETED", 8, 10, "2026-07-14"],
  ["dead-cells", "PLAYING", 8, 28],
  ["subnautica", "COMPLETED", 9, 38, "2026-08-30"],
];

const FREE_LIBRARY: Entry[] = [
  ["the-witcher-3-wild-hunt", "COMPLETED", 9, 95, "2025-05-01", "Кровавый барон — лучший квест."],
  ["cyberpunk-2077", "PLAYING", 8, 30],
  ["stardew-valley", "COMPLETED", 8, 80, "2025-09-12"],
  ["hades", "PLAYING", 9, 25],
  ["portal-2", "COMPLETED", 10, 9, "2024-06-10"],
  ["minecraft", "DROPPED", 7, 200],
  ["elden-ring", "WANT", null, null],
  ["it-takes-two", "COMPLETED", 9, 14, "2026-02-14"],
  ["forza-horizon-5", "PLAYING", 7, 40],
  ["resident-evil-village", "COMPLETED", 7, 11, "2025-10-31"],
];

async function upsertUser(email: string, name: string, username: string, plan: string, isPublic: boolean) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return db.user.upsert({
    where: { email },
    update: { plan, isPublic },
    create: { email, name, username, plan, isPublic, passwordHash },
  });
}

async function fillLibrary(userId: string, entries: Entry[]) {
  const map = new Map<string, string>();
  for (const [slug, status, rating, hours, completed, review] of entries) {
    const game = await db.game.findUnique({ where: { slug } });
    if (!game) {
      console.warn(`  ! нет игры в каталоге: ${slug}`);
      continue;
    }
    const platforms: string[] = JSON.parse(game.platforms);
    const ug = await db.userGame.upsert({
      where: { userId_gameId: { userId, gameId: game.id } },
      update: {},
      create: {
        userId,
        gameId: game.id,
        status,
        rating,
        hoursPlayed: hours,
        review,
        platformPlayed: platforms[0] ?? null,
        completedAt: completed ? new Date(completed) : null,
      },
    });
    map.set(slug, ug.id);
  }
  return map;
}

async function main() {
  console.log(`Каталог: ${SEED_GAMES.length} игр`);
  for (const g of SEED_GAMES) {
    const data = {
      title: g.title,
      coverUrl: g.coverUrl,
      releaseYear: g.releaseYear,
      genres: JSON.stringify(g.genres),
      platforms: JSON.stringify(g.platforms),
    };
    await db.game.upsert({ where: { slug: g.slug }, update: data, create: { slug: g.slug, ...data } });
  }

  const pro = await upsertUser("pro@savepoint.dev", "Алекс", "alex", "PRO", true);
  const free = await upsertUser("free@savepoint.dev", "Сэм", "sam", "FREE", false);

  const proMap = await fillLibrary(pro.id, PRO_LIBRARY);
  await fillLibrary(free.id, FREE_LIBRARY);

  const shelves: [string, string, string[]][] = [
    ["Лучшие хорроры", "Игры, после которых спишь со светом", ["silent-hill-2", "signalis", "resident-evil-4", "dead-space", "mouthwashing", "resident-evil-2"]],
    ["Шедевры на 10/10", "Без них игровая жизнь была бы беднее", ["elden-ring", "hollow-knight", "baldurs-gate-3", "outer-wilds", "the-witcher-3-wild-hunt", "clair-obscur-expedition-33"]],
  ];
  for (const [name, description, slugs] of shelves) {
    const exists = await db.shelf.findFirst({ where: { userId: pro.id, name } });
    if (exists) continue;
    const shelf = await db.shelf.create({ data: { userId: pro.id, name, description } });
    let position = 0;
    for (const slug of slugs) {
      const userGameId = proMap.get(slug);
      if (userGameId) await db.shelfItem.create({ data: { shelfId: shelf.id, userGameId, position: position++ } });
    }
  }

  console.log("Готово. Демо: pro@savepoint.dev / free@savepoint.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
