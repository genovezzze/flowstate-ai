# FlowState AI — правила проекта

Полное ТЗ: `docs/SPEC.md`. Макеты: `docs/design/`. Перед любой задачей сверяйся с ними.

## Стек
Expo + React Native + TypeScript (strict), Expo Router, TanStack Query, Zustand, Zod,
Бэкенд в `server/`: Hono на Vercel + Better Auth (email, Apple, Google) + Neon Postgres (Frankfurt), Claude API только с сервера. EAS для сборок.

## Жёсткие правила
- Движок рекомендаций (`src/engine`) — чистый TS без React/сети. Любое изменение правил = новые/обновлённые юнит-тесты.
- ИИ не выбирает упражнения и проценты, только объясняет решение движка и ведёт чат. Всегда есть шаблонный фолбэк.
- Никаких API-ключей в приложении. Секреты — в Vercel env / EAS secrets. В приложении только EXPO_PUBLIC_API_URL.
- Каждый SQL-запрос на сервере фильтрует по `user_id` из сессии Better Auth; все таблицы `on delete cascade` от "user".
- Приложение local-first: всё работает из zustand-стора, синхронизация — `src/lib/sync.ts`.
- Health-данные (цикл, симптомы, сон) не отправлять в аналитику, Sentry-breadcrumbs и тексты пушей.
- Никакого медицинского языка: не «диагноз/лечение», а «самочувствие/рекомендация». Красные флаги → «обратись к врачу».
- Цвета, шрифты, радиусы — только из `src/theme`, без хардкода.
- UI-текст на английском, собран в одном месте (подготовка к i18n).

## Команды
- `npx expo start` — dev-сервер
- `npm test` — тесты (движок обязателен к прохождению)
- `npx tsc --noEmit` — проверка типов
- `eas build -p ios --profile preview` — сборка для TestFlight
