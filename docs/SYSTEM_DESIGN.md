# Kyomei MVP — System Design Document

> **Version**: 1.0 (P0)
> **Last Updated**: February 9, 2026
> **Status**: Active
> **Related Docs**: [SPRINT_PLAN.md](./SPRINT_PLAN.md), Kyomei-MVP-PRD.pdf

---

## Table of Contents

1. [Overview](#1-overview)
2. [P0 Scope & Boundaries](#2-p0-scope--boundaries)
3. [Core User Flows](#3-core-user-flows)
4. [Tech Stack & Decision Rationale](#4-tech-stack--decision-rationale)
5. [Architecture](#5-architecture)
6. [Data Model](#6-data-model)
7. [API Design](#7-api-design)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Authentication & Security](#9-authentication--security)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)
11. [P1 Handoff Points](#11-p1-handoff-points)
12. [Known Issues to Fix](#12-known-issues-to-fix)
13. [Assumptions](#13-assumptions)
14. [Verification & Testing Strategy](#14-verification--testing-strategy)
15. [Decision Log](#15-decision-log)

---

## 1. Overview

Kyomei is an anime personalization app for users interested in watching anime but unsure about their preferred genres. The app guides users through a "vibe check" questionnaire to capture genre preferences, then provides a Netflix-style genre-grouped catalog where users can browse, search, rate, and organize anime into a watchlist.

**Target audience**: Beta testers and anime-curious users (<100 concurrent users).

**P0 deliverable**: A working app where a user can sign up, complete the vibe check (preferences saved for P1 recommendation engine), browse anime by genre, rate anime 1-5 stars, and manage a 3-state watchlist.

---

## 2. P0 Scope & Boundaries

### In Scope (P0)

| Feature | Description |
|---------|-------------|
| **Auth** | Email/password signup & login with JWT |
| **Vibe Check** | 5-7 multiple-choice questions, one-time, preferences stored |
| **Genre Browse** | Netflix-style horizontal carousels grouped by genre, search by title, filter by genre |
| **Anime Detail** | Dedicated `/anime/:id` page with full details |
| **Ratings** | 1-5 star rating on any anime (upsert) |
| **Watchlist** | Add/remove anime with 3 statuses: `plan_to_watch`, `watching`, `completed` |
| **Genre Profile** | Computed from vibe check answers and stored — ready for P1 consumption |

### Deferred to P1

| Feature | Reason |
|---------|--------|
| Recommendation engine (scoring, ranking) | Requires vibe check + ratings data to be meaningful; needs its own design |
| Recommendation explanations ("why this anime") | Depends on recommendation engine |
| Profile refinement from ratings | Depends on recommendation engine |
| Vibe check retake | Profile evolution handled by recommendation engine in P1 |
| Email verification / password reset | Not critical for <100 beta users |
| Admin panel | Seed data managed via Prisma scripts |
| Social features | Out of MVP scope entirely |

### P0 Post-Vibe-Check UX

After completing the vibe check, users see a **toast notification**: *"Your preferences are saved! Personalized recommendations are coming soon."* — then land on the genre browse page. This sets expectations that the recommendation engine is a future feature while still providing immediate value through browsable, searchable content.

---

## 3. Core User Flows

### Flow 1: Sign Up → Vibe Check → Browse

```
[Sign Up Page] → JWT issued → [Vibe Check Wizard (5-7 questions)]
    → Submit answers → Genre profile computed & stored
    → Toast: "Preferences saved! Recs coming soon."
    → [Genre Browse Page (Netflix-style carousels)]
```

### Flow 2: Browse → Discover → Detail → Rate / Watchlist

```
[Browse Page] → Search by title or filter by genre
    → Click anime card → [Anime Detail Page]
    → Rate 1-5 stars (saved for P1 profile refinement)
    → Add to watchlist (default: plan_to_watch)
```

### Flow 3: Watchlist Management

```
[Watchlist Page] → View entries grouped/filterable by status
    → Change status: plan_to_watch → watching → completed
    → Remove from watchlist
```

### Flow 4: Returning User

```
[Login Page] → JWT issued
    → Vibe check already done? → [Browse Page]
    → Vibe check not done? → [Vibe Check Wizard]
```

---

## 4. Tech Stack & Decision Rationale

### Frontend: React + React Router

| Decision | Alternatives Considered | Tradeoff | Why It Fits |
|----------|------------------------|----------|-------------|
| **React (SPA)** | Next.js (SSR/SSG), Remix | SSR adds server complexity, deployment cost, and operational overhead. SPA is simpler to reason about and deploy (static files to Vercel). | <100 users means no SEO pressure, no need for server-side rendering. The app is behind auth, so crawlers never see content. SPA keeps the architecture simple: one build artifact, one deploy target. |
| **React Router** | TanStack Router, file-based routing (Next.js) | React Router is the most mature SPA routing solution. TanStack Router is newer with less community support. | Straightforward route definitions, well-documented protected route patterns, and the team already uses React — no context switching. |
| **Vite** | Create React App (deprecated), Webpack | CRA is no longer maintained. Webpack is configurable but slower. | Vite is the standard modern React build tool — fast HMR, zero-config for our use case, and already set up in the project. |
| **shadcn/ui** | Material UI, Chakra UI, Headless UI | MUI and Chakra ship large bundles. Headless UI has fewer components. | shadcn/ui gives us copy-pasted, ownable components built on Radix primitives — already installed in the project. No runtime dependency lock-in. |

### Backend: Express.js + JWT

| Decision | Alternatives Considered | Tradeoff | Why It Fits |
|----------|------------------------|----------|-------------|
| **Express.js** | Fastify, Hono, NestJS | Fastify is faster but Express has the largest ecosystem. NestJS adds heavy abstraction (decorators, DI) that's overkill here. Hono is newer with less community support. | Express is the simplest, most well-documented Node.js server framework. At <100 users, raw performance differences are irrelevant. The project already has Express set up. |
| **REST API** | GraphQL, tRPC | GraphQL adds schema complexity and tooling overhead. tRPC requires end-to-end TypeScript coupling. | With ~10 endpoints and a simple data model, REST is the right level of abstraction. No overfetching problems at 50 anime records. |
| **Zod validation** | Joi, Yup, class-validator | Joi/Yup are older, less TypeScript-native. class-validator requires decorator syntax. | Zod is TypeScript-first, already in the project (v4.3.6), and naturally pairs with the typed Express handlers. |

### Database: PostgreSQL + Prisma

| Decision | Alternatives Considered | Tradeoff | Why It Fits |
|----------|------------------------|----------|-------------|
| **PostgreSQL** | SQLite, MySQL, MongoDB | SQLite doesn't support concurrent writes well in production. MySQL lacks PostgreSQL's array types (needed for `genres`). MongoDB's flexibility is unnecessary — our data is highly relational. | PostgreSQL handles our relational data model naturally (users → ratings → anime), supports native array columns for genre tags, and Railway offers managed Postgres with zero setup. |
| **Prisma ORM** | Drizzle, Knex, TypeORM | Drizzle is lighter but less mature migration tooling. Knex is a query builder, not an ORM — more boilerplate. TypeORM has a troubled maintenance history. | Prisma provides type-safe queries, excellent migration management, and a visual studio (`prisma studio`) for debugging data. Already configured in the project with the PostgreSQL adapter. |

### Language: TypeScript

| Decision | Alternatives Considered | Tradeoff | Why It Fits |
|----------|------------------------|----------|-------------|
| **TypeScript (strict)** | JavaScript, TypeScript (loose) | TS adds compilation step and some verbosity. Loose TS misses many bugs. | Strict TypeScript catches type errors at build time, which is especially valuable in a full-stack app where API contracts between client and server need to stay in sync. Both packages already have `strict: true`. |

---

## 5. Architecture

### High-Level Diagram

```
┌──────────────────────┐       HTTPS/JSON       ┌──────────────────────┐       Prisma/SQL       ┌───────────────┐
│                      │ ─────────────────────►  │                      │ ─────────────────────► │               │
│   React SPA          │                         │   Express.js API     │                        │  PostgreSQL   │
│   (Vercel CDN)       │ ◄─────────────────────  │   (Railway)          │ ◄───────────────────── │  (Railway)    │
│                      │                         │                      │                        │               │
│ • React Router       │                         │ • JWT Middleware     │                        │ • users       │
│ • AuthContext (JWT)  │                         │ • Zod Validation     │                        │ • anime       │
│ • Genre Carousels    │                         │ • CORS (allowlist)   │                        │ • ratings     │
│ • Search / Filter    │                         │ • Morgan Logging     │                        │ • watchlist   │
│ • localStorage token │                         │                      │                        │ • vibe_*      │
└──────────────────────┘                         └──────────────────────┘                        └───────────────┘
```

### Why This Architecture

- **No BFF (Backend-for-Frontend)**: A BFF adds an extra service layer between the SPA and the API. With a single SPA consuming a single API, a BFF is unnecessary indirection.
- **No SSR**: The app is entirely behind authentication — search engines don't need to crawl it. SSR would add server costs and deployment complexity for zero benefit.
- **No caching layer (Redis)**: 50 anime records, <100 users. PostgreSQL handles this volume without breaking a sweat. Adding Redis would mean another service to provision, configure, and monitor.
- **No message queue / background jobs**: All operations are synchronous and fast. The recommendation engine in P1 will run in-request (50 anime × simple dot product = microseconds). No need for async job processing.

### Request Flow

```
Client Request
    │
    ▼
[CORS check] ── blocked if origin ≠ allowed ──► 403
    │
    ▼
[Morgan logger] ── logs method, path, status, response time
    │
    ▼
[express.json()] ── parses JSON body
    │
    ▼
[Route handler]
    │
    ├── Public routes (/api/auth/*) ──► Zod validation ──► Service layer ──► Prisma ──► Response
    │
    └── Protected routes (/api/*) ──► [JWT Middleware] ── invalid token ──► 401
                                           │
                                           ▼ (valid token, userId attached to req)
                                      Zod validation ──► Service layer ──► Prisma ──► Response
```

---

## 6. Data Model

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │  vibe_questions   │       │    anime     │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ user_id (PK) │──┐    │ question_id (PK) │──┐    │ anime_id(PK) │──┐
│ username     │  │    │ question_text    │  │    │ title        │  │
│ email        │  │    │ display_order    │  │    │ synopsis     │  │
│ password_hash│  │    │ options (JSON)   │  │    │ cover_image  │  │
│ created_at   │  │    └──────────────────┘  │    │ genres[]     │  │
│ updated_at   │  │                          │    │ episodes     │  │
└──────────────┘  │    ┌──────────────────┐  │    │ status       │  │
                  │    │ vibe_responses   │  │    │ mal_score    │  │
                  │    ├──────────────────┤  │    │ created_at   │  │
                  ├───►│ user_id (FK)     │  │    └──────────────┘  │
                  │    │ question_id (FK) │◄─┘                      │
                  │    │ selected_option  │         ┌────────────┐  │
                  │    │ created_at       │         │  ratings   │  │
                  │    └──────────────────┘         ├────────────┤  │
                  │     unique(user_id,             │ user_id(FK)│◄─┤
                  │            question_id)    ┌───►│ anime_id(FK│◄─┤
                  │                            │    │ score(1-5) │  │
                  │    ┌───────────────────┐   │    │ created_at │  │
                  │    │ user_genre_profile│   │    │ updated_at │  │
                  │    ├───────────────────┤   │    └────────────┘  │
                  ├───►│ user_id (FK, UQ)  │   │     unique(user_id,│
                  │    │ affinities (JSON) │   │            anime_id)│
                  │    │ updated_at        │   │                    │
                  │    └───────────────────┘   │    ┌────────────┐  │
                  │                            │    │ watchlist  │  │
                  │                            │    ├────────────┤  │
                  └────────────────────────────┼───►│ user_id(FK)│  │
                                               │    │ anime_id(FK│◄─┘
                                               │    │ status     │
                                               │    │ created_at │
                                               │    │ updated_at │
                                               │    └────────────┘
                                               │     unique(user_id,
                                               │            anime_id)
```

### Model Definitions

#### `users` (existing — no changes)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | Int | PK, autoincrement | |
| `username` | String | Unique, varchar(50) | |
| `email` | String | Unique, varchar(100) | |
| `password_hash` | String | varchar(100) | bcrypt hash (60 chars) |
| `created_at` | DateTime | Default: `now()` | |
| `updated_at` | DateTime | Default: `now()` | |

#### `vibe_questions` (new — seeded, static)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `question_id` | Int | PK, autoincrement | |
| `question_text` | String | Not null | e.g., "Pick your vibe:" |
| `display_order` | Int | Not null | Controls question sequence |
| `options` | Json | Not null | Array of `{ label: string, genre_tags: string[] }` |

The `options` JSON structure per question:
```json
[
  { "label": "Epic battles and superpowers", "genre_tags": ["Action", "Sci-Fi"] },
  { "label": "Deep mysteries and mind games", "genre_tags": ["Mystery", "Psychological"] },
  { "label": "Cozy everyday moments", "genre_tags": ["Slice of Life", "Comedy"] }
]
```

**Why JSON for options instead of a separate `question_options` table?**
Options are always fetched alongside their question, never queried independently, and the structure is simple (label + tags). A join table would add query complexity for no benefit. JSON keeps the schema flat and the seed script simpler.

#### `vibe_responses` (new)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `response_id` | Int | PK, autoincrement | |
| `user_id` | Int | FK → users | |
| `question_id` | Int | FK → vibe_questions | |
| `selected_option` | String | Not null | Label of chosen option |
| `created_at` | DateTime | Default: `now()` | |

- **Unique constraint**: `(user_id, question_id)` — one answer per question per user. Prevents duplicate submissions.

#### `anime` (new — seeded)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `anime_id` | Int | PK, autoincrement | |
| `title` | String | Not null | |
| `synopsis` | String | Not null | Brief description |
| `cover_image` | String | Not null | External URL (MAL/AniList CDN) |
| `genres` | String[] | Not null | PostgreSQL text array |
| `episodes` | Int | Nullable | Some may be unknown |
| `status` | String | Not null | "Finished Airing", "Currently Airing" |
| `mal_score` | Float | Nullable | Reference score for sort tiebreaking |
| `created_at` | DateTime | Default: `now()` | |

**Why a PostgreSQL text array for `genres` instead of a many-to-many `anime_genres` join table?**
With a fixed taxonomy of ~14 genres, the genre list per anime is small (2-4 items) and doesn't require independent querying of the genre entity. An array column supports `@>` (contains) queries natively in PostgreSQL for filtering, and avoids a join table + pivot queries. If genres needed metadata (descriptions, icons, parent categories), a join table would be warranted — but for P0's flat list, the array is simpler.

#### `ratings` (new)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `rating_id` | Int | PK, autoincrement | |
| `user_id` | Int | FK → users | |
| `anime_id` | Int | FK → anime | |
| `score` | Int | Not null, 1-5 | Validated by Zod on API layer |
| `created_at` | DateTime | Default: `now()` | |
| `updated_at` | DateTime | Default: `now()` | Updated on re-rate |

- **Unique constraint**: `(user_id, anime_id)` — one rating per anime per user. Re-ratings upsert (update existing row).

#### `watchlist` (new)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `watchlist_id` | Int | PK, autoincrement | |
| `user_id` | Int | FK → users | |
| `anime_id` | Int | FK → anime | |
| `status` | Enum | Not null | `plan_to_watch`, `watching`, `completed` |
| `created_at` | DateTime | Default: `now()` | |
| `updated_at` | DateTime | Default: `now()` | Updated on status change |

- **Unique constraint**: `(user_id, anime_id)` — one watchlist entry per anime per user.

**Why an enum for watchlist status instead of a string?**
An enum enforces valid values at the database level, not just in application code. If someone bypasses Zod validation (e.g., direct DB access, future admin tool), invalid statuses can't be inserted. The set of statuses is small and fixed for the foreseeable future.

#### `user_genre_profile` (new — computed, stored for P1)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `profile_id` | Int | PK, autoincrement | |
| `user_id` | Int | FK → users, unique | One profile per user |
| `affinities` | Json | Not null | e.g., `{ "Action": 0.8, "Romance": 0.3 }` |
| `updated_at` | DateTime | Default: `now()` | |

**Why a separate table instead of a JSON column on `users`?**
Separation of concerns: the user table represents identity (auth domain), the genre profile represents taste (recommendation domain). Keeping them separate means the recommendation engine in P1 can query, update, and index profiles independently without touching the auth-critical users table. It also makes it trivial to drop and recompute all profiles if the algorithm changes.

**Why compute and store this in P0 if it's not consumed until P1?**
Because the vibe check is the only time we capture this data. If we didn't compute the profile during P0, we'd either need to reprocess all historical vibe responses when P1 launches (migration complexity) or ask users to retake the vibe check (bad UX). Computing on submission is cheap and forward-looking.

### Genre Taxonomy

The following flat genre list is used across `vibe_questions.options.genre_tags` and `anime.genres`:

```
Action, Adventure, Comedy, Drama, Fantasy, Horror,
Mecha, Mystery, Psychological, Romance, Sci-Fi,
Slice of Life, Sports, Thriller
```

An anime can have 1-4 genres. An anime will appear in multiple genre carousels (e.g., an anime tagged `["Action", "Sci-Fi"]` appears in both the Action and Sci-Fi rows on the browse page).

---

## 7. API Design

All endpoints are prefixed with `/api`. Protected endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth Routes

| Method | Path | Auth | Request Body | Response (200/201) | Errors |
|--------|------|------|-------------|-------------------|--------|
| `POST` | `/api/auth/signup` | No | `{ username, email, password }` | `{ token, user: { userId, username, email } }` | 400 (validation), 409 (email/username taken) |
| `POST` | `/api/auth/login` | No | `{ email, password }` | `{ token, user: { userId, username, email } }` | 400 (validation), 401 (invalid credentials) |

### Vibe Check Routes

| Method | Path | Auth | Request Body | Response (200) | Errors |
|--------|------|------|-------------|----------------|--------|
| `GET` | `/api/vibe-check/questions` | Yes | — | `{ questions: [{ questionId, questionText, displayOrder, options }] }` | 401 |
| `POST` | `/api/vibe-check/responses` | Yes | `{ responses: [{ questionId, selectedOption }] }` | `{ message: "Preferences saved", profile: { affinities } }` | 400 (validation), 401, 409 (already completed) |
| `GET` | `/api/vibe-check/status` | Yes | — | `{ completed: boolean }` | 401 |

**Design note on `POST /responses`**: This endpoint receives all answers in a single request (not one-at-a-time) because the vibe check wizard collects all answers client-side before submitting. This means:
- One network request instead of 5-7
- Profile computation happens once with all data
- Atomic operation — all answers saved or none (wrapped in a transaction)

### Anime Routes

| Method | Path | Auth | Request Body / Params | Response (200) | Errors |
|--------|------|------|-----------------------|----------------|--------|
| `GET` | `/api/anime` | Yes | Query: `?search=`, `?genre=` | `{ anime: [{ animeId, title, synopsis, coverImage, genres, episodes, status, malScore, userRating?, watchlistStatus? }] }` | 401 |
| `GET` | `/api/anime/genres` | Yes | — | `{ genres: ["Action", "Adventure", ...] }` | 401 |
| `GET` | `/api/anime/:id` | Yes | Param: `id` | `{ anime: { ...full detail, userRating?, watchlistEntry? } }` | 401, 404 |

**Design note on `GET /api/anime`**: This endpoint enriches each anime with the requesting user's rating (`userRating`) and watchlist status (`watchlistStatus`) via a LEFT JOIN. This avoids the client needing to make separate requests for "all anime", "my ratings", and "my watchlist entries" and then client-side joining them — which would be 3 round trips instead of 1.

**Why no pagination?** With ~50 anime in the catalog, the full dataset is ~25-50KB of JSON. Pagination machinery (cursor tracking, page state, loading indicators per page) adds complexity that provides no benefit at this scale. If the catalog grows past ~200 in a future release, cursor-based pagination can be added to `GET /api/anime` without breaking existing clients (additive query param).

### Rating Routes

| Method | Path | Auth | Request Body | Response (200/201) | Errors |
|--------|------|------|-------------|-------------------|--------|
| `POST` | `/api/anime/:id/rate` | Yes | `{ score: 1-5 }` | `{ rating: { ratingId, animeId, score, updatedAt } }` | 400 (validation), 401, 404 (anime not found) |
| `GET` | `/api/users/me/ratings` | Yes | — | `{ ratings: [{ ratingId, score, anime: { animeId, title, coverImage, genres } }] }` | 401 |

**Design note on `POST /rate`**: This is an upsert — if the user has already rated this anime, the existing rating is updated. This is more intuitive than requiring the client to check whether a rating exists and then decide between POST and PUT. The endpoint is idempotent: calling it twice with the same score produces the same result.

### Watchlist Routes

| Method | Path | Auth | Request Body / Params | Response | Errors |
|--------|------|------|-----------------------|----------|--------|
| `GET` | `/api/watchlist` | Yes | Query: `?status=` | `{ entries: [{ watchlistId, status, anime: { animeId, title, coverImage, genres } }] }` | 401 |
| `POST` | `/api/watchlist` | Yes | `{ animeId, status? }` | 201: `{ entry: { watchlistId, animeId, status } }` | 400, 401, 404 (anime), 409 (already in watchlist) |
| `PATCH` | `/api/watchlist/:id` | Yes | `{ status }` | 200: `{ entry: { watchlistId, status, updatedAt } }` | 400, 401, 404 |
| `DELETE` | `/api/watchlist/:id` | Yes | — | 204 (no content) | 401, 404 |

### Health Check

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/api/health` | No | `{ status: "ok", timestamp }` |

Used for deployment smoke tests and Railway health monitoring.

### Error Response Format

All errors follow a consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```

Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

---

## 8. Frontend Architecture

### Routing Map

| Path | Component | Auth Required | Navigation Guard |
|------|-----------|:------------:|------------------|
| `/` | Redirect | — | → `/browse` (auth'd + vibe done), `/vibe-check` (auth'd + no vibe), `/login` (not auth'd) |
| `/login` | `LoginPage` | No | Redirect to `/browse` if already authenticated |
| `/signup` | `SignUpPage` | No | Redirect to `/browse` if already authenticated |
| `/vibe-check` | `VibeCheckPage` | Yes | Redirect to `/browse` if vibe check already completed |
| `/browse` | `BrowsePage` | Yes | Redirect to `/vibe-check` if not completed |
| `/anime/:id` | `AnimeDetailPage` | Yes | — |
| `/watchlist` | `WatchlistPage` | Yes | — |

### Component Hierarchy

```
<App>
├── <AuthProvider>                    ← Global auth context
│   ├── <Routes>
│   │   ├── /login → <LoginPage>
│   │   │   └── <LoginForm>
│   │   │
│   │   ├── /signup → <SignUpPage>
│   │   │   └── <SignUpForm>
│   │   │
│   │   ├── <ProtectedRoute>          ← Checks auth + vibe check status
│   │   │   ├── /vibe-check → <VibeCheckPage>
│   │   │   │   └── <VibeCheckWizard>
│   │   │   │       ├── <ProgressBar>
│   │   │   │       ├── <QuestionCard>
│   │   │   │       └── <Button> (Next / Submit)
│   │   │   │
│   │   │   ├── /browse → <BrowsePage>
│   │   │   │   ├── <SearchBar>
│   │   │   │   ├── <GenreFilter>     ← Horizontal genre chips
│   │   │   │   └── <GenreCarousel>   ← One per genre
│   │   │   │       └── <AnimeCard>*
│   │   │   │           ├── <StarRating>
│   │   │   │           └── <WatchlistButton>
│   │   │   │
│   │   │   ├── /anime/:id → <AnimeDetailPage>
│   │   │   │   ├── <AnimeCoverImage>
│   │   │   │   ├── <AnimeMetadata>   ← Synopsis, genres, episodes, status
│   │   │   │   ├── <StarRating>
│   │   │   │   └── <WatchlistStatusSelect>
│   │   │   │
│   │   │   └── /watchlist → <WatchlistPage>
│   │   │       ├── <StatusFilter>    ← Tabs or chips: all / plan / watching / completed
│   │   │       └── <WatchlistEntry>*
│   │   │           ├── <AnimeCard> (compact)
│   │   │           └── <WatchlistStatusSelect>
│   │   │
│   │   └── <Navigation>              ← Persistent nav bar (Browse, Watchlist, Logout)
```

### State Management

| State | Scope | Storage | Rationale |
|-------|-------|---------|-----------|
| Auth (JWT, user) | Global | `AuthContext` + `localStorage` | Needed everywhere for API calls and route guards |
| Vibe check answers (in-progress) | Local | `VibeCheckWizard` component state | Only needed during the wizard; discarded after submission |
| Anime list | Local | `BrowsePage` `useEffect` + `useState` | Fetched once on mount; small dataset doesn't warrant global cache |
| Ratings | Local | Component state; optimistic update on `StarRating` | Ratings modify a single value — no complex state to sync |
| Watchlist | Local | `WatchlistPage` `useEffect` + `useState` | Fetched on mount; mutations update local state directly |
| Vibe check status | Auth context | Fetched once after login, cached in `AuthContext` | Drives route guards; checked on every protected navigation |

**Why not Redux or TanStack Query?**
Both add significant conceptual overhead (stores, reducers, query keys, cache invalidation). With <10 API endpoints, ~50 records in the primary dataset, and no real-time updates, local `useState` + `useEffect` is sufficient and easier to debug. If P1 introduces dashboards with multiple interdependent data sources, TanStack Query would be a worthwhile addition — but for P0, it's premature abstraction.

### API Client (`src/lib/api.ts`)

A thin wrapper around `fetch`:

```
- Base URL from VITE_API_URL environment variable
- Automatically attaches Authorization: Bearer <token> header from localStorage
- Parses JSON responses
- On 401 response: clears auth state, redirects to /login
- Typed helper functions: api.get<T>(path), api.post<T>(path, body), api.patch<T>(path, body), api.delete(path)
```

**Why a custom `fetch` wrapper instead of Axios?**
Axios adds ~13KB (gzipped) to the bundle for features we don't need (interceptors, request cancellation, automatic transforms, progress events). Our API client needs exactly two things: attach a JWT header and handle 401s. A 20-line `fetch` wrapper does this with zero dependencies.

---

## 9. Authentication & Security

### Auth Flow

```
[Sign Up / Login]
    │
    ▼
API returns { token, user }
    │
    ▼
Client stores token in localStorage
    │
    ▼
AuthContext updates: isAuthenticated=true, user={...}
    │
    ▼
All subsequent API calls include: Authorization: Bearer <token>
    │
    ▼
Server verifies token → extracts userId → attaches to req.userId
```

### JWT Strategy: Single Access Token (7-day expiry)

| Factor | Our Approach | Alternative (Access + Refresh) | Why Ours Fits |
|--------|-------------|-------------------------------|---------------|
| **Tokens** | 1 JWT, 7-day expiry | Short-lived access (15min) + long-lived refresh (30d) | Refresh token flow requires: a `/refresh` endpoint, server-side token storage (DB or Redis), rotation logic, and client-side retry logic on 401. That's significant complexity for <100 beta users. |
| **Revocation** | No server-side revocation | Refresh tokens can be revoked by deleting from DB | If a token is compromised, we wait for expiry (max 7 days). For a beta app with no payment info or sensitive personal data, this is an acceptable risk. |
| **UX** | User stays logged in for 7 days | User stays logged in indefinitely (refresh tokens auto-renew) | 7-day sessions are fine for casual anime browsing. Logging in once a week is not onerous. |

**When to upgrade**: If Kyomei adds payment processing, social features, or scales past beta, implementing refresh token rotation with httpOnly cookies becomes worthwhile.

### Token Storage: `localStorage`

| Factor | localStorage | httpOnly Cookie | Why localStorage Fits P0 |
|--------|-------------|-----------------|--------------------------|
| **XSS vulnerability** | Tokens are accessible to JavaScript — an XSS attack could steal the token | Tokens are invisible to JavaScript — XSS can make requests but can't exfiltrate the token | localStorage is vulnerable to XSS, but preventing XSS is the primary defense regardless of storage choice. React's JSX auto-escapes output, and we don't use `dangerouslySetInnerHTML`. If XSS exists, httpOnly cookies only prevent token *theft* — the attacker can still make authenticated requests from the user's browser (CSRF-like). |
| **CSRF vulnerability** | Not vulnerable to CSRF (token is manually attached, not auto-sent) | Requires CSRF protection (cookies are auto-sent on every request to the domain) | httpOnly cookies need a CSRF token mechanism (double-submit cookie or synchronizer token), which adds another layer of server-side complexity. |
| **Implementation** | Trivial: `localStorage.setItem('token', jwt)` | Requires: `Set-Cookie` headers, `withCredentials: true`, `sameSite` + `secure` + `httpOnly` flags, CORS credential mode, cookie parsing middleware | The httpOnly cookie approach is better in theory but requires significantly more infrastructure. For <100 beta users with no sensitive data, the simpler approach is appropriate. |
| **Cross-domain** | Works across any domains (API on Railway, SPA on Vercel) | Requires same domain or subdomain for cookies to work, or complex CORS cookie config | Our API (Railway) and frontend (Vercel) are on different domains. httpOnly cookies across different domains require `sameSite=None; Secure` and CORS `credentials: include`, which adds cross-origin complexity. |

**When to upgrade**: If the app stores sensitive personal data, handles payments, or is targeted by attackers, migrating to httpOnly cookies with CSRF protection is recommended. The migration path is straightforward: change the auth endpoints to set/clear cookies, remove `localStorage` usage, add `withCredentials` to fetch calls, and add CSRF middleware.

### Input Validation

Every API endpoint validates request bodies with Zod schemas before any business logic executes:

- **Auth**: `signUpSchema` (username 1-50 chars, valid email, password 8-64 chars), `signInSchema` (email, password)
- **Vibe check**: Array of `{ questionId: int, selectedOption: string }` — validate that all required questions are answered and options are valid
- **Ratings**: `{ score: z.number().int().min(1).max(5) }`
- **Watchlist**: `{ animeId: int, status?: z.enum(["plan_to_watch", "watching", "completed"]) }`

### Other Security Measures

| Measure | Implementation | Notes |
|---------|---------------|-------|
| Password hashing | bcrypt, 10 salt rounds | Industry standard; 10 rounds = ~100ms per hash (acceptable latency, sufficient security for MVP) |
| CORS | `cors({ origin: process.env.CORS_ORIGIN })` | Restrict to Vercel domain in production; `*` in development |
| SQL injection | Prisma parameterized queries | ORM-level protection; no raw SQL |
| Rate limiting | **Not implemented in P0** | <100 users; revisit in P1 with `express-rate-limit` if abuse is observed |
| HTTPS | Enforced by Vercel and Railway | Both platforms serve over HTTPS by default |
| Secrets management | Environment variables (`JWT_SECRET`, `DATABASE_URL`) | Never committed to git; set in Vercel/Railway dashboards |

---

## 10. Deployment & Infrastructure

### Environment Matrix

| | Development | Production |
|---|---|---|
| **Frontend** | `localhost:5173` (Vite dev server) | Vercel (auto-deploy from `packages/client`) |
| **Backend** | `localhost:3000` (tsc-watch) | Railway (auto-deploy from `packages/api`) |
| **Database** | Local PostgreSQL or Railway dev instance | Railway managed PostgreSQL |
| **`VITE_API_URL`** | `http://localhost:3000/api` | `https://<railway-app>.railway.app/api` |
| **`CORS_ORIGIN`** | `http://localhost:5173` | `https://<vercel-app>.vercel.app` |
| **`JWT_SECRET`** | Any dev string | Cryptographically random, ≥32 chars |

### Deployment Pipeline

#### Frontend (Vercel)
```
Git push → Vercel detects packages/client
    → npm install → npm run build (tsc + vite build)
    → Output: dist/ (static SPA)
    → Served from Vercel CDN
    → Env: VITE_API_URL set in Vercel dashboard
```

**Vercel configuration**: Set the root directory to `packages/client` in project settings. Vercel's default build command (`npm run build`) and output directory (`dist`) work without customization.

#### Backend (Railway)
```
Git push → Railway detects packages/api
    → npm install → npm run build (tsc)
    → Start: npm start (node dist/index.js)
    → Post-deploy: npx prisma migrate deploy && npx prisma db seed
    → Env: DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN set in Railway dashboard
```

**Railway configuration**: Set the root directory to `packages/api`. Use Railway's managed PostgreSQL addon — the `DATABASE_URL` is auto-provisioned.

#### Database Migrations
- **Development**: `npx prisma migrate dev` (creates + applies migration, regenerates client)
- **Production**: `npx prisma migrate deploy` (applies pending migrations only, never creates new ones)
- **Seeding**: `npx prisma db seed` — runs `prisma/seed.ts` to populate vibe questions and ~50 anime. The seed script should be idempotent (use `upsert` or check-before-insert) so it's safe to re-run on deploy.

### Why Vercel + Railway Instead of Vercel for Everything?

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Vercel for SPA + Railway for API** | Clear separation of concerns. Express.js runs as a long-lived process (WebSocket-ready for future). Railway handles Postgres natively. | Two platforms to manage. | ✅ **Chosen** — simpler mental model, each platform does what it does best. |
| **Vercel for both (serverless functions)** | Single platform. Free tier covers small scale. | Express.js must be restructured into serverless function format. Cold starts on every request. No persistent connections (WebSocket future blocked). Prisma cold-start overhead (~1-2s for initial connection). | Not ideal for an Express app that already exists as a long-running server. |

---

## 11. P1 Handoff Points

These are the hooks built into P0 that P1 will consume:

| P0 Artifact | How P1 Uses It |
|-------------|----------------|
| `user_genre_profile.affinities` | Recommendation scoring: dot product of user affinities vector against each anime's genre vector |
| `vibe_responses` table | Allows P1 to recompute all profiles if the scoring algorithm changes |
| `ratings` table | Profile refinement: boost genre affinities for highly-rated anime, reduce for low-rated |
| `anime.genres[]` array | Recommendation explanation strings: *"Because you like Action and Sci-Fi"* |
| Genre taxonomy (flat list) | Shared vocabulary between vibe questions, anime tags, and future recommendation explanations |
| `GET /api/recommendations` (not built in P0) | New endpoint in P1 that scores + ranks anime using the genre profile; may supplement or replace the browse-first UX |

### P1 Recommendation Engine (Preview)

For context on *why* we're storing `user_genre_profile` in P0, here's the planned P1 algorithm:

1. **Scoring**: For each anime the user hasn't rated, compute `score = Σ (user_affinity[genre] × anime_has_genre[genre])` — a dot product of the user's affinity vector and the anime's binary genre vector.
2. **Ranking**: Sort by score descending; tiebreak by `mal_score`.
3. **Explanation**: For each result, return the top 2-3 matching genres: *"Recommended because you like Action and Psychological"*.
4. **Refinement**: After each rating, adjust affinities: rating ≥ 4 boosts genres (+0.1, capped at 1.0), rating ≤ 2 reduces genres (-0.1, floored at 0.0).

This runs synchronously in-request. At 50 anime × ~14 genres, the computation is negligible (<1ms).

---

## 12. Known Issues to Fix

These pre-existing issues in the codebase must be resolved before or during P0 implementation:

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `packages/api/src/index.ts` | Missing `app.listen()` call and route mounting — server never starts | Add `app.listen(port)` and import/mount `authRouter` |
| 2 | `packages/api/src/server.ts` | `authRouter` defined in routes but never imported or registered on the Express app | Mount router: `app.use('/api/auth', authRouter)` (in `index.ts` or `server.ts`) |
| 3 | `packages/api/src/middleware/authMiddleware.ts` | `next()` called unconditionally after try/catch — on error, both `next(err)` and `next()` fire (double next) | Add `return` after `next(err)` in the catch block, or restructure control flow |
| 4 | `packages/api/src/dbQuery/userQuery.ts` | Unused `bcrypt` import | Remove the import |
| 5 | Root `kyomei/` subdirectory | Duplicates the entire `packages/` structure — causes confusion about which files are canonical | Remove the duplicate `kyomei/` directory; work from root `packages/` only |
| 6 | `packages/client/src/context/SignInContext.tsx` | Placeholder context not consumed by any component; will be replaced by `AuthContext` | Delete `SignInContext.tsx` when `AuthContext` is implemented |

---

## 13. Assumptions

1. **Anime catalog**: ~50 anime pre-seeded from user's curated list. No external API dependency at runtime. Cover images reference external URLs (MAL/AniList CDN) — no image hosting needed.
2. **Genre taxonomy**: Flat list of ~14 genres (no hierarchy, no sub-genres). Fixed for P0.
3. **Vibe check**: One-time, not retakable in P0. Profile evolution comes from ratings in P1.
4. **Scale**: <100 concurrent users. No need for caching, pagination, rate limiting, or horizontal scaling.
5. **Data access**: All anime shown to all users (no access control beyond authentication). A single `GET /api/anime` call returns the full catalog.
6. **Anime in multiple carousels**: An anime tagged `["Action", "Romance"]` appears in both genre carousels on the browse page. This is intentional — it maximizes discoverability.
7. **Shared package**: `packages/shared/` remains empty for P0. Shared types (if any) are duplicated between client and API. This is acceptable at our scale; a shared package adds build pipeline complexity.
8. **No admin interface**: Seed data managed exclusively via Prisma seed scripts and Studio.
9. **No email verification or password reset**: Out of scope for P0 beta.
10. **No analytics or telemetry**: Not needed for <100 beta testers. If needed, a simple server-side event log can be added in P1.

---

## 14. Verification & Testing Strategy

### Manual Testing Checklist (P0 DoD)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | Sign up with valid email/password | Account created, JWT returned, redirected to vibe check |
| 2 | Sign up with duplicate email | 409 error, user sees "email already taken" |
| 3 | Log in with valid credentials | JWT returned, redirected to browse (if vibe check done) or vibe check |
| 4 | Log in with wrong password | 401 error, user sees "invalid credentials" |
| 5 | Complete vibe check (answer all questions) | Toast: "Preferences saved!", redirected to browse page |
| 6 | Attempt to access `/browse` without vibe check | Redirected to `/vibe-check` |
| 7 | Browse page shows genre carousels | Each genre with anime is a horizontal scrollable row |
| 8 | Search anime by title | Carousels filter to show only matching anime |
| 9 | Filter anime by genre | Only the selected genre's carousel is shown |
| 10 | Click anime card → detail page | Full details shown: synopsis, genres, episodes, cover image |
| 11 | Rate anime 1-5 stars | Rating saved, star display updates immediately |
| 12 | Re-rate the same anime | Previous rating updated (not duplicated) |
| 13 | Add anime to watchlist | Entry created with `plan_to_watch` status |
| 14 | Change watchlist status | Status updates to `watching` or `completed` |
| 15 | Remove from watchlist | Entry deleted |
| 16 | Watchlist page shows entries | Entries displayed with correct statuses, filterable |
| 17 | Log out and log back in | All data persists (ratings, watchlist, vibe check completed) |
| 18 | Access API without token | 401 on all protected endpoints |
| 19 | Health check endpoint | `GET /api/health` returns 200 |

### API Testing

Test each endpoint with a REST client (Thunder Client, Postman, or curl) during development. Key scenarios:
- Auth flow: signup → login → use token for protected routes
- Vibe check: fetch questions → submit responses → verify status changes to `completed`
- CRUD: rate anime, add/update/remove watchlist entries
- Error cases: invalid data, missing fields, duplicate operations, expired tokens

### Database Verification

- After schema changes: `npx prisma migrate dev` → verify with `npx prisma studio`
- After seeding: confirm vibe questions (5-7 rows) and anime (~50 rows) exist with correct data
- After operations: verify ratings and watchlist entries are created with correct foreign keys and constraints

---

## 15. Decision Log

A consolidated record of all architectural decisions made for P0, with tradeoffs documented.

| # | Decision | Alternatives Considered | Tradeoff | Why Appropriate for Kyomei P0 |
|---|----------|------------------------|----------|-------------------------------|
| 1 | React SPA (no SSR) | Next.js SSR/SSG | SSR adds server complexity + cost; SPA is simpler to deploy and reason about | App is behind auth — no SEO benefit from SSR. <100 users means no performance concern. |
| 2 | Express.js REST API | NestJS, Fastify, GraphQL, tRPC | Express is less opinionated / slower than Fastify, but has the largest ecosystem | Already set up in project. ~10 endpoints don't need the abstraction of NestJS or the flexibility of GraphQL. |
| 3 | Single JWT (7-day expiry) | Access + refresh token pair | No server-side revocation; user must wait up to 7 days if token is compromised | No sensitive data (payments, PII beyond email). <100 beta users. Refresh token flow adds 3-4 new components (endpoint, storage, rotation, client retry) for marginal security gain. |
| 4 | Token in localStorage | httpOnly cookies | Vulnerable to XSS (but React auto-escapes); not vulnerable to CSRF | httpOnly cookies across different domains (Vercel ↔ Railway) require complex CORS cookie config + CSRF protection. localStorage is simpler and works across any domains. For a beta app with no sensitive data, the XSS risk is acceptable with standard React practices. |
| 5 | Pre-seeded static anime dataset (~50) | External API (Jikan/AniList), hybrid | No real-time data; requires manual curation | Eliminates external API dependency, rate limits, and downtime risk. 50 anime is enough for beta testing the core loop. |
| 6 | Tag/genre matching (deferred to P1) | Weighted scoring, LLM-based recommendations | Simplest algorithm; may feel basic | Deterministic, debuggable, no external cost. Perfectly adequate for 50 anime × 14 genres. Can upgrade to weighted scoring in P2 if needed. |
| 7 | Vibe questions in database (seeded) | Hardcoded in frontend, admin-configurable | Extra DB table; slight over-engineering vs. hardcoded | Allows changing questions by running seed script (no frontend redeploy). Doesn't require an admin UI. Good middle ground. |
| 8 | PostgreSQL text array for genres | Many-to-many join table (`anime_genres`) | Arrays can't have foreign key constraints; no genre metadata | 14 fixed genres with no metadata. Array supports `@>` containment queries. Join table adds complexity for zero benefit at this scale. |
| 9 | JSON column for vibe question options | Separate `question_options` table | No relational integrity on options; harder to query individual options | Options are always fetched with their question, never independently. JSON keeps the schema flat and seed scripts simple. |
| 10 | Separate `user_genre_profile` table | JSON column on `users` table | Extra table; slightly more complex queries | Clean domain separation (identity vs. taste). P1 recommendation engine can query/update profiles independently. Easy to drop and recompute all profiles if algorithm changes. |
| 11 | Compute genre profile in P0 (consume in P1) | Defer computation to P1 | Stores data that P0 doesn't use | Avoids needing to reprocess all historical vibe responses when P1 launches. Cheap to compute. Forward-looking. |
| 12 | 3-state watchlist enum | Simple boolean "saved" list | Slightly more complex model | Matches the user story exactly. Status tracking is a core feature users expect from anime tracking. |
| 13 | Local state + useEffect (no Redux/TanStack Query) | Redux Toolkit, TanStack Query, Zustand | No global cache; refetch on navigation | ~10 endpoints, 50 records, no real-time updates. Local state is sufficient and easier to debug. Add TanStack Query in P1 if data fetching complexity grows. |
| 14 | Custom fetch wrapper (no Axios) | Axios | No interceptors, progress events, retries | We need exactly two features: attach JWT + handle 401. A 20-line wrapper does this at 0KB bundle cost vs. Axios at ~13KB. |
| 15 | Vercel (SPA) + Railway (API + DB) | Vercel for everything (serverless) | Two platforms to manage | Express.js as a long-lived server avoids cold starts and serverless restructuring. Railway handles Postgres natively. Clear separation of concerns. |
| 16 | No pagination on anime endpoint | Cursor-based pagination | Full dataset returned every time | ~50 records = ~25-50KB JSON. Pagination adds client-side state management complexity for no user-facing benefit. Revisit at ~200+ records. |
| 17 | Enriched anime response (includes user's rating + watchlist status) | Separate endpoints for anime, ratings, watchlist | Larger response payload; coupled concerns | Eliminates 2 extra round trips per page load. At 50 records, the payload increase is negligible. Client-side joining 3 datasets is more error-prone. |

---

*This document is the source of truth for Kyomei P0 architecture. Update it as decisions evolve.*
