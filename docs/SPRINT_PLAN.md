# Kyomei MVP Sprint Plan (P0: Core Loop)

> **Sprint Duration**: 2 Weeks  
> **Time Commitment**: ~2 hours/day (~28 hours total)  
> **Sprint Goal**: Functional auth flow + vibe check + anime rating with Vercel deployment

---

## 📊 Current State Assessment

### What You Have ✅
- Prisma configured with PostgreSQL adapter
- Basic `users` table schema (user_id, username, email, password_hash, timestamps)
- Express server skeleton with CORS, Morgan logging
- Placeholder `AuthService` class structure
- Route structure for `/signup` and `/login`
- React client with SignInForm UI component and shadcn/ui primitives

### What's Missing ❌
- Complete authentication implementation (JWT, password hashing)
- Database schema for vibe check questions/responses
- Database schema for anime ratings
- API routes for vibe check and ratings
- Frontend pages/components for vibe check and ratings
- Environment configuration for deployment
- Input validation middleware

---

## 🎯 P0 User Stories (From PRD)

| # | User Story | Backend Work | Frontend Work |
|---|------------|--------------|---------------|
| 1 | As a new user, I want to sign up with my email | Auth service, JWT, password hashing | Sign up form, auth context |
| 2 | As a new user, I want to complete a quick vibe check (5-7 questions) | Questions API, responses storage | Vibe check wizard UI |
| 3 | As an authenticated user, I want to rate anime (1-5 stars) | Anime/ratings schema, rating API | Star rating component, anime cards |

---

## 📅 Week 1: Authentication & Database Foundation

### Day 1-2: Schema Design & Auth Backend (~4 hours)

**Goal**: Fully functional signup/login with JWT

#### Tasks:
- [ ] **Update Prisma Schema** - Add tables for vibe check and ratings
  ```
  Questions to ask yourself:
  - What fields does a "vibe_check_question" need?
  - How do you link a user's response to a question?
  - What does an "anime_rating" record look like?
  ```
  
- [ ] **Implement AuthService**
  - Install dependencies: `bcrypt`, `jsonwebtoken`, `@types/bcrypt`, `@types/jsonwebtoken`
  - Implement `signUp()`: hash password → create user → generate JWT
  - Implement `login()`: verify password → generate JWT
  
- [ ] **Create auth middleware** for protected routes

#### Research Topics:
- [ ] How does `bcrypt.hash()` and `bcrypt.compare()` work?
- [ ] What should go in a JWT payload? What should NOT?
- [ ] What's the difference between access tokens and refresh tokens?

#### Checkpoint Questions (Ask Yourself):
1. Why do we hash passwords instead of encrypting them?
2. What happens if someone steals a JWT?
3. Where should you store JWTs on the client?

---

### Day 3-4: Auth Frontend & Protected Routes (~4 hours)

**Goal**: Working sign-up/sign-in flow with JWT stored client-side

#### Tasks:
- [ ] **Create SignUpForm component** (similar to existing SignInForm)
- [ ] **Build AuthContext** for managing auth state
  - Store JWT in localStorage/memory
  - Provide `user`, `login()`, `logout()`, `signup()` to children
  
- [ ] **Connect forms to API**
  - Use `fetch` or install a lightweight HTTP client
  - Handle loading/error states
  
- [ ] **Create ProtectedRoute wrapper** component

#### Research Topics:
- [ ] React Context API patterns for authentication
- [ ] Why some people say "don't store JWTs in localStorage"
- [ ] How to handle token expiration gracefully

#### Checkpoint Questions:
1. What's the difference between Context and props for auth state?
2. How would you implement "remember me" functionality?
3. What should happen when an API returns 401 Unauthorized?

---

### Day 5-7: Vibe Check Feature (~6 hours)

**Goal**: User can answer 5-7 personality questions after signup

#### Tasks:
- [ ] **Run Prisma migration** for new vibe check tables
- [ ] **Seed database** with 5-7 hardcoded vibe check questions
  - Example: "Pick a vibe: Chill Sunday vs. Intense Monday"
  - Example: "Which appeals more: Mystery or Comedy?"
  
- [ ] **Create API routes**:
  - `GET /api/vibe-check/questions` - fetch all questions
  - `POST /api/vibe-check/responses` - save user's answers (requires auth)

- [ ] **Build VibeCheck UI components**:
  - `VibeCheckPage` - container/wizard
  - `QuestionCard` - displays single question with options
  - Progress indicator (e.g., "Question 3 of 7")

#### Research Topics:
- [ ] Prisma seeding (`prisma db seed`)
- [ ] Multi-step form patterns in React (wizard pattern)
- [ ] How to track progress through a form

#### Checkpoint Questions:
1. Should vibe check questions be editable by admins later? How does that affect your schema?
2. What happens if a user refreshes mid-quiz?
3. How do you prevent a user from submitting the vibe check twice?

---

## 📅 Week 2: Anime Ratings & Deployment

### Day 8-9: Anime Rating Backend (~4 hours)

**Goal**: Users can rate anime 1-5 stars

#### Tasks:
- [ ] **Design anime data strategy**
  - Option A: Hardcode a small list of anime for MVP
  - Option B: Use external API (MyAnimeList, AniList, Jikan)
  - **Recommendation for MVP**: Seed 10-20 popular anime manually
  
- [ ] **Create rating tables** in Prisma schema
- [ ] **Build API routes**:
  - `GET /api/anime` - list anime (paginated)
  - `POST /api/anime/:id/rate` - submit rating (requires auth)
  - `GET /api/users/me/ratings` - get current user's ratings

#### Research Topics:
- [ ] Database indexing - why index `user_id` on ratings?
- [ ] API pagination patterns (offset vs. cursor)
- [ ] Preventing duplicate ratings (upsert pattern)

#### Checkpoint Questions:
1. If a user rates the same anime twice, should it create a new record or update?
2. How would you calculate average rating for an anime efficiently?
3. What's the tradeoff of using an external anime API vs. seeding data?

---

### Day 10-11: Anime Rating Frontend (~4 hours)

**Goal**: Users can browse anime and submit ratings

#### Tasks:
- [ ] **Create StarRating component**
  - Interactive 1-5 star selector
  - Show current rating state
  
- [ ] **Create AnimeCard component**
  - Display anime poster, title, your rating
  
- [ ] **Create AnimeListPage**
  - Grid of anime cards
  - Each card has star rating capability
  
- [ ] **Connect to backend** and handle optimistic updates

#### Research Topics:
- [ ] Optimistic UI updates (update UI before API confirms)
- [ ] Image optimization in Vite/React
- [ ] Responsive grid layouts with CSS Grid or Flexbox

#### Checkpoint Questions:
1. What happens if the rating API fails after you've shown success to the user?
2. How do you show that a rating is "saving"?
3. Should you refetch all ratings after one changes, or update state locally?

---

### Day 12-13: Integration & Polish (~4 hours)

**Goal**: Everything works together smoothly

#### Tasks:
- [ ] **Build navigation flow**:
  - Unauthenticated: Landing → Sign Up → Vibe Check → Anime Rating
  - Authenticated: Skip to Anime Rating
  
- [ ] **Add loading states** throughout the app
- [ ] **Add error handling** (toast notifications or inline errors)
- [ ] **Basic styling pass** - make it look presentable
- [ ] **Test the full flow** end-to-end locally

#### Research Topics:
- [ ] React Router protected routes pattern
- [ ] Toast notification libraries (sonner, react-hot-toast)
- [ ] Form validation libraries (zod, yup) vs. native validation

---

### Day 14: Deployment (~2 hours)

**Goal**: App is live on Vercel

#### Tasks:
- [ ] **Set up Vercel project**
  - Connect GitHub repo
  - Configure monorepo settings (packages/client as frontend)
  
- [ ] **Deploy backend**
  - Option A: Vercel Serverless Functions (convert Express routes)
  - Option B: Deploy Express separately (Railway, Render)
  - **Recommendation**: Railway for Express, Vercel for React
  
- [ ] **Configure environment variables** on deployment platform
- [ ] **Set up production database** (Neon, Supabase, or Railway Postgres)
- [ ] **Test deployed version** end-to-end

#### Research Topics:
- [ ] Vercel monorepo deployment configuration
- [ ] Environment variables in production (never commit secrets!)
- [ ] CORS configuration for production domains

#### Checkpoint Questions:
1. What's the difference between `DATABASE_URL` in dev vs. production?
2. Why can't you use the same JWT secret in development and production?
3. How do you debug issues that only happen in production?

---

## 🗂️ Suggested File Structure Additions

```
packages/
├── api/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts          # NEW: dedicated auth routes
│   │   │   ├── vibeCheck.ts     # NEW: vibe check routes
│   │   │   └── anime.ts         # NEW: anime & rating routes
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts    # NEW: JWT verification
│   │   │   └── errorHandler.ts      # NEW: centralized error handling
│   │   └── services/
│   │       ├── authService.ts       # EXISTS: implement fully
│   │       ├── vibeCheckService.ts  # NEW
│   │       └── animeService.ts      # NEW
│   └── prisma/
│       ├── schema.prisma        # UPDATE: add new models
│       └── seed.ts              # NEW: seed data
│
├── client/
│   └── src/
│       ├── pages/               # NEW folder
│       │   ├── Landing.tsx
│       │   ├── SignUp.tsx
│       │   ├── SignIn.tsx
│       │   ├── VibeCheck.tsx
│       │   └── AnimeRatings.tsx
│       ├── components/
│       │   ├── StarRating.tsx   # NEW
│       │   ├── AnimeCard.tsx    # NEW
│       │   ├── QuestionCard.tsx # NEW
│       │   └── ProtectedRoute.tsx # NEW
│       └── context/
│           └── AuthContext.tsx  # NEW (replace SignInContext)
```

---

## ⚠️ Risk Factors & Contingency

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Auth takes longer than expected | Medium | Day 1-2 has buffer; auth is highest priority |
| External anime API is unreliable | Low | Seed local data instead |
| Vercel deployment issues with monorepo | Medium | Have Railway as backup for full-stack |
| Scope creep (adding P1 features) | High | Stick to this document! |

---

## ✅ Definition of Done Checklist

- [ ] User can sign up with email/password
- [ ] User can sign in and receive JWT
- [ ] New user completes 5-7 vibe check questions
- [ ] Authenticated user can view anime list
- [ ] Authenticated user can rate anime 1-5 stars
- [ ] Ratings persist and display correctly
- [ ] App is deployed and accessible via URL
- [ ] No console errors in production

---

## 📚 Recommended Resources

### Authentication
- [JWT.io](https://jwt.io/) - JWT debugger and intro
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### React Patterns
- [React Router v6 Auth Example](https://reactrouter.com/en/main/start/examples)
- [Kent C. Dodds - Authentication in React](https://kentcdodds.com/blog/authentication-in-react-applications)

### Deployment
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Railway Express Deployment](https://docs.railway.app/guides/express)

---

## 💡 Daily Standup Template

Ask yourself each day:
1. What did I complete yesterday?
2. What am I working on today?
3. Am I blocked on anything?

Track progress by checking off tasks in this document!

---

**Remember: Verify this output yourself** - this plan is a guide, not a rigid contract. Adjust as you learn what works for your pace!
