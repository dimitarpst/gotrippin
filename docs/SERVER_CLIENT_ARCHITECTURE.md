# Server vs Client Components — Go Trippin' Architecture

> **Delete this file once the Server Component migration is complete.**

---

## Server Components: What They Actually Are

Server Components are not a "backend" like NestJS or Supabase. They're **React components that run on the server during the request**. They can:
- Fetch data directly (DB, API, file system)
- Keep secrets (API keys, DB credentials) on the server
- Return HTML/JSON to the client — but their JavaScript is never sent to the browser

The client receives the output, not the code. So they're the "read + render" layer of your Next.js app, not a replacement for your backend.

---

## Where Server Components Fit in Go Trippin'

Use them for **initial data loading** and **layout** — anywhere you're mainly displaying data.

### 1. Home Page (Trip List)

**Current:** `useTrips` + `useEffect` fetches trips in the client.

**Target:** Server Component fetches trips, passes them as props to a Client Component.

```
[Server] Fetch trips for user → [Client] TripsList (filtering, search, grid, create)
```

- Trips appear in first paint (faster, better SEO)
- `TripsList` stays client for filters, search, click handlers
- Less JS shipped to the browser

---

### 2. Trip Detail Page (`/trips/[id]`)

**Current:** Multiple hooks (`useTrip`, `useTripLocations`, `useTripTimeline`, `useTripWeather`) each fetch in the client.

**Target:** Server Component fetches trip + locations + timeline in one server request, passes to Client Component.

```
[Server] Fetch trip + locations + timeline → [Client] TripOverview
```

- Trip content in first paint instead of loading spinners
- Weather can stay client-side (dynamic, user-triggered refresh)
- Fewer waterfalls and duplicated loading logic

---

### 3. Create / Edit Trip Pages

**Current:** Form state + client validation + API calls.

**Target:** Keep the **form as Client Component**. It needs `useState`, validation, interactivity. The page shell can be Server Component, but the form itself stays client.

---

### 4. User Profile Page

**Current:** Client fetches profile.

**Target:** Server fetches profile, passes to Client Component for editing.

```
[Server] Fetch profile → [Client] UserProfile (edit form, avatar upload)
```

---

### 5. Layouts

- **Root layout** — Already Server Component (uses cookies for i18n)
- **Auth layout** — Server (static shell)
- **Trip layout** — Could fetch basic trip info on server for breadcrumbs/nav

---

## Target Architecture: Strong Base to Grow From

```
┌─────────────────────────────────────────────────────────────────┐
│  Server Components (pages, layouts)                              │
│  • Run on hosting                                                │
│  • Fetch trip list, trip details, profile                        │
│  • Pass data as props to Client Components                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ props
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Client Components (interactive UI)                              │
│  • TripsList, TripOverview, forms, modals, filters               │
│  • Receive data from parent Server Components                    │
│  • Mutations via Server Actions → NestJS API                     │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**
- **Reads:** Server Component fetches → passes to Client Component
- **Writes:** Client Component → Server Action → NestJS (or Supabase)
- **Auth:** Session from cookies on server; middleware for redirects

---

## Prerequisites for Migration

1. **Auth on the server** — Supabase session from cookies so Server Components know the user
2. **Data source decision** — Server Components call NestJS API or Supabase directly for reads
3. **Server Actions** — For create/update/delete, so mutations stay on server
4. **Boundaries** — Layout + data = Server; interactivity = Client

---

## Quick Reference: Where to Use What

| Page / Area   | Server Component? | Why                                      |
|---------------|-------------------|------------------------------------------|
| Home (trips)  | Yes               | Fetch trip list on server                |
| Trip detail   | Yes               | Fetch trip + locations + timeline        |
| Create/Edit   | Partial           | Page shell server, form stays client     |
| User profile  | Yes               | Fetch profile on server                  |
| Auth pages    | Shell only        | Forms stay client                        |
| Layouts       | Yes               | Fetch nav/breadcrumb data                |

---

## Completion Checklist

- [ ] Auth session available on server (Supabase cookies)
- [ ] Home page: Server fetches trips → Client TripsList
- [ ] Trip detail: Server fetches trip + locations + timeline → Client TripOverview
- [ ] User profile: Server fetches profile → Client UserProfile
- [ ] Server Actions for trip create/update/delete
- [ ] Middleware for auth redirects (remove useEffect redirects)
- [ ] **Delete this file**
