# SavePoint — дневник геймера

SaaS-сервис для ведения коллекции игр: статусы, оценки 1–10, отзывы, статистика, «Игровой итог года» в стиле Wrapped, AI-рекомендации, полки и публичный профиль.

**Стек:** Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 · Prisma + SQLite · Auth.js v5 · Google GenAI SDK (Gemini) · Anthropic SDK · Recharts

## Быстрый старт

```bash
npm install
cp .env.example .env        # затем впиши AUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev      # создаёт prisma/dev.db и запускает сид
npm run dev
```

Открой http://localhost:3000.

### Демо-аккаунты (создаются сидом)

| Email | Пароль | Тариф |
|---|---|---|
| `pro@savepoint.dev` | `savepoint` | Pro, публичный профиль `/u/alex` |
| `free@savepoint.dev` | `savepoint` | Free |

## Переменные окружения

| Переменная | Обязательна | Назначение |
|---|---|---|
| `DATABASE_URL` | да | `file:./dev.db` |
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
prisma/            схема БД и сид (каталог + демо-пользователи)
src/app/           страницы: лендинг, (auth), (app)/library|game|stats|wrapped|recommendations|shelves|settings, u/[username]
src/actions/       server actions: коллекция, полки, профиль/тариф, каталог, рекомендации
src/lib/           plans, auth, rawg, stats (статистика + Wrapped), recommendations (Claude + фолбэк)
src/components/    UI: карточки игр, фильтры, редактор записи, модалка Pro, графики, Wrapped
```

## Скрипты

- `npm run dev` — разработка
- `npm run build` / `npm start` — прод-сборка
- `npm run typecheck`, `npm run lint`
- `npm run db:seed` — перезалить каталог и демо-аккаунты
- `npm run db:reset` — пересоздать БД с нуля
