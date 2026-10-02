# SavePoint — дневник геймера

SaaS-сервис для ведения коллекции игр: статусы, оценки 1–10, отзывы, статистика, «Игровой итог года» в стиле Wrapped, AI-рекомендации, полки и публичный профиль.

**Стек:** Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 · Prisma + Postgres ([Neon](https://neon.com)) · Auth.js v5 · Google GenAI SDK (Gemini) · Anthropic SDK · Recharts · хостинг [Vercel](https://vercel.com)

## Деплой: Vercel + Neon

1. **Neon.** Создай проект на https://console.neon.tech (регион — ближайший к твоим пользователям, например Frankfurt `aws-eu-central-1`).
   На странице **Connect** скопируй две строки подключения: с включённым **Connection pooling** (в хосте есть `-pooler`) и без него.
2. **Схема и каталог в Neon.** Впиши обе строки в локальный `.env` (`DATABASE_URL` и `DATABASE_URL_UNPOOLED`) и выполни:
   ```bash
   npm run db:deploy          # создать таблицы
   npm run db:seed:catalog    # залить каталог игр (без демо-аккаунтов)
   ```
3. **Vercel.** На https://vercel.com/new импортируй репозиторий с GitHub. Framework определится как Next.js сам.
   В **Environment Variables** добавь:

   | Переменная | Значение |
   |---|---|
   | `DATABASE_URL` | строка Neon **с** `-pooler` |
   | `DATABASE_URL_UNPOOLED` | строка Neon **без** `-pooler` |
   | `AUTH_SECRET` | новый секрет: `openssl rand -base64 32` (не тот, что локально) |
   | `RAWG_API_KEY` | ключ RAWG |
   | `GEMINI_API_KEY` | ключ Gemini (необязательно) |

4. **Регион функций.** В Vercel → Settings → Functions выбери регион рядом с базой Neon (например, Frankfurt `fra1`), иначе каждый запрос к БД будет идти через океан.
5. Нажми **Deploy**. При каждой сборке Vercel сам применяет новые миграции (`prisma migrate deploy` входит в `npm run build`), а каждый пуш в `main` автоматически деплоится.

> Вместо ручного шага 1 можно подключить Neon из Vercel: **Storage → Create → Neon**. Интеграция сама создаст `DATABASE_URL` и `DATABASE_URL_UNPOOLED` и будет делать отдельную ветку базы для каждого preview-деплоя.

## Локальная разработка

```bash
npm install
cp .env.example .env        # впиши строки Neon и AUTH_SECRET
npm run db:deploy           # применить миграции
npm run db:seed             # каталог + демо-аккаунты
npm run dev
```

Для разработки удобно завести в Neon отдельную ветку базы (**Branches → Create branch**), чтобы не трогать продакшен-данные.

### Демо-аккаунты (только `npm run db:seed`)

| Email | Пароль | Тариф |
|---|---|---|
| `pro@savepoint.dev` | `savepoint` | Pro, публичный профиль `/u/alex` |
| `free@savepoint.dev` | `savepoint` | Free |

## Переменные окружения

| Переменная | Обязательна | Назначение |
|---|---|---|
| `DATABASE_URL` | да | Neon, подключение через пул (для приложения) |
| `DATABASE_URL_UNPOOLED` | да | Neon, прямое подключение (для миграций) |
| `AUTH_SECRET` | да | секрет для сессий Auth.js |
| `RAWG_API_KEY` | нет | поиск по базе [RAWG](https://rawg.io/apidocs) (~500k игр). Без ключа поиск идёт по встроенному каталогу из ~200 игр |
| `GEMINI_API_KEY` | нет | AI-рекомендации через Gemini ([получить ключ](https://aistudio.google.com/apikey)). Без AI-ключей включается алгоритм по жанрам |
| `GEMINI_MODEL` | нет | по умолчанию `gemini-3.5-flash-lite` |
| `ANTHROPIC_API_KEY` | нет | альтернатива: рекомендации через Claude, если `GEMINI_API_KEY` не задан |
| `ANTHROPIC_MODEL` | нет | по умолчанию `claude-opus-5-5` |

## Тарифы

| | Free | Pro |
|---|---|---|
| Игр в коллекции | до 50 | без лимита |
| Статусы, оценки, поиск и фильтры | ✓ | ✓ |
| Отзывы | до 500 символов | до 5000 символов |
| Статистика, итог года, AI, полки, публичный профиль | — | ✓ |

Все лимиты задаются в одном месте: [src/lib/plans.ts](src/lib/plans.ts). Pro-доступ проверяется и на сервере (server actions и страницы), и в UI: на Free клик по Pro-функции открывает окно с предложением перейти на Pro.

**Оплата не подключена.** Кнопка «Перейти на Pro» сразу меняет тариф (демо-режим) — см. `changePlan` в [src/actions/profile.ts](src/actions/profile.ts). При подключении платёжки там создаётся checkout-сессия, а смена `plan` переносится в вебхук.

## Структура

```
prisma/            схема БД, миграции и сид (каталог + демо-пользователи)
src/app/           страницы: лендинг, (auth), (app)/library|game|stats|wrapped|recommendations|shelves|settings, u/[username]
src/actions/       server actions: коллекция, полки, профиль/тариф, каталог, рекомендации
src/lib/           plans, auth, rawg, stats (статистика + Wrapped), recommendations (Gemini/Claude + фолбэк)
src/components/    UI: карточки игр, фильтры, редактор записи, модалка Pro, графики, Wrapped
```

## Скрипты

- `npm run dev` — разработка
- `npm run build` — применить миграции и собрать (так же собирает Vercel)
- `npm run typecheck`, `npm run lint`
- `npm run db:migrate` — создать новую миграцию после изменения схемы
- `npm run db:deploy` — применить миграции к базе
- `npm run db:seed` — каталог + демо-аккаунты
- `npm run db:seed:catalog` — только каталог (для продакшена)
