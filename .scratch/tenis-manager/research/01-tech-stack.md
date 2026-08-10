# Tech Stack Recommendation: Tennis Class Management App

## Executive Recommendation

| Layer | Choice | Cost (est.) |
|-------|--------|-------------|
| **Frontend** | Next.js (React 19) | Free tier |
| **Backend + DB + Auth** | Supabase (PostgreSQL + Auth + Realtime) | Free → $25/mo |
| **Hosting** | Vercel (frontend) + Supabase (backend) | $0–25/mo total |
| **Auth** | Supabase Auth (included) | Included in Supabase |

**Total estimated cost: $0–25/month** for a small team with tens of users.

---

## 1. Frontend Framework: Next.js (React 19)

### Recommendation: **Next.js (React)**

### Why not the others?

| Framework | Verdict for this project |
|-----------|--------------------------|
| **React / Next.js** | ✅ **Pick.** Largest ecosystem, most libraries, best mobile-first component options (shadcn/ui, Radix, MUI). Server Components reduce client JS. Vercel deployment is one-click. |
| **Vue / Nuxt** | Strong alternative. Gentler learning curve, excellent docs, cohesive ecosystem. If your team already knows Vue, pick Nuxt. The ecosystem is smaller but sufficient for this app. |
| **Svelte / SvelteKit** | Best raw performance (2KB baseline), smallest bundles. But ecosystem is smaller (fewer UI component libraries), hiring pool narrower. Risky for a 1-2 person team that may need to onboard help. |
| **Astro** | Content sites. Not for interactive dashboards with drag-and-drop. |

### Reasoning

- **Mobile-first UX**: shadcn/ui and Radix primitives give you responsive, accessible components out of the box. Tailwind CSS (default in shadcn) is ideal for mobile-first layouts.
- **Ecosystem**: Drag-and-drop libraries (dnd-kit), calendar components, payment UIs — React has the most options.
- **Server Components**: Next.js App Router renders on the server by default, reducing JS sent to mobile devices. Critical for mobile-first performance.
- **Hiring**: If you ever need help, React developers are the easiest to find.
- **React Native path**: If you later want a native mobile app, React knowledge transfers directly.

### Trade-offs

- React's learning curve has steepened with Server Components and the App Router
- Bundle size is larger than Vue or Svelte (45KB baseline vs 33KB / 2KB)
- State management requires choosing between options (Zustand is the current default)

---

## 2. Backend: Supabase (BaaS)

### Recommendation: **Supabase** — not a custom backend

### Why not the others?

| Option | Verdict for this project |
|--------|--------------------------|
| **Supabase** | ✅ **Pick.** Managed PostgreSQL + Auth + Realtime + Edge Functions in one platform. Free tier covers 50K MAU. No server to manage. |
| **Custom Node.js (Express/NestJS)** | Overkill for this scale. You'd spend weeks building auth, RLS, file uploads, and real-time subscriptions that Supabase gives you. A 1-2 person team should not be运维 infrastructure. |
| **Django** | Excellent if your team knows Python, but heavier than needed. Django's admin panel is nice but Supabase's dashboard covers similar ground. |
| **Firebase** | NoSQL (Firestore) is a poor fit for relational data (students ↔ classes ↔ groups ↔ payments). Supabase's PostgreSQL is a much better data model fit. |

### Reasoning

- **Relational data**: Students belong to classes, classes have professors, payments link students to classes. This is textbook relational data. PostgreSQL handles this perfectly.
- **Auth built-in**: Supabase Auth handles email/password, Google OAuth, role management — all without a separate service.
- **Real-time**: When a professor accepts a candidate, students see it immediately. Supabase Realtime (Postgres logical replication → WebSocket) gives this out of the box.
- **Row Level Security (RLS)**: Students can only see their own data. Professors see their classes. Admins see everything. All enforced at the database level, not application code.
- **Edge Functions**: For complex logic (monthly billing generation, auto-creating class instances from templates), Deno Edge Functions run server-side without managing a server.
- **Self-hosting escape hatch**: If you ever outgrow managed Supabase, you can self-host the entire stack (it's open source).

### Trade-offs

- You're committing to the Supabase ecosystem (though it's open source)
- Edge Functions run on Deno, not Node.js (minor friction if you need NPM packages)
- Dashboard UI is good but not as full-featured as a custom admin panel

---

## 3. Database: PostgreSQL (via Supabase)

### Recommendation: **PostgreSQL** — managed by Supabase

### Why?

- **The data is inherently relational**: Students → Classes → Groups → Payments. Foreign keys, joins, constraints. This is what Postgres was built for.
- **RLS policies**: Access control at the database level. Students see only their classes and payments. Professors manage their groups. Admins see everything. No application-layer permission code needed.
- **Complex queries**: "Show me all students who applied to open classes but haven't paid this month" — trivial in SQL, painful in NoSQL.
- **JSON support**: If you need flexible fields (e.g., custom class metadata), Postgres JSONB gives you NoSQL flexibility inside a relational database.
- **pgvector**: If you ever want AI features (e.g., smart class recommendations), pgvector is built-in.

### Why not the others?

| Database | Verdict |
|----------|---------|
| **PostgreSQL** | ✅ **Pick.** Relational, mature, RLS, huge community. |
| **MySQL** | Viable but Postgres has better JSON support, RLS, and extension ecosystem. |
| **MongoDB** | Wrong data model. Payments, class schedules, and student enrollments are relational. NoSQL would require denormalization and manual consistency. |
| **SQLite** | Single-writer limitation. Fine for read-heavy apps but not for concurrent writes from multiple professors. |

---

## 4. Hosting: Vercel + Supabase

### Recommendation: **Vercel** (frontend) + **Supabase** (backend/database/auth)

### Why?

| Platform | Verdict |
|----------|---------|
| **Vercel + Supabase** | ✅ **Pick.** Vercel deploys Next.js with zero config. Supabase handles everything backend. Total cost: $0–25/mo. |
| **Railway** | Good alternative if you want a traditional backend server. Slightly more ops work than Vercel + Supabase combo. |
| **Render** | Similar to Railway but with slower cold starts and less modern DX. |
| **Fly.io** | Overkill. Global edge deployment isn't needed for a local tennis school with tens of users. |
| **AWS / GCP** | Way too complex for this team and scale. |

### Reasoning

- **Vercel**: Push to deploy from Git. Automatic HTTPS, preview deployments for PRs, edge functions if needed. Free tier is sufficient for this scale.
- **Supabase**: Free tier includes database, auth, storage, and realtime. $25/mo Pro tier if you need more.
- **Combined cost**: $0–25/month for the entire stack. You cannot beat this price-to-features ratio for a small team.
- **Zero ops**: No servers to patch, no Docker to manage, no CI/CD pipelines to configure.

### Alternative: Railway

If you prefer a single platform and want more control: Railway can host both your Next.js frontend and a Supabase-like Postgres database. Usage-based pricing starts at $5/mo. Slightly more hands-on than Vercel + Supabase but keeps everything in one dashboard.

### Trade-offs

- Vercel's free tier has bandwidth limits (100GB/mo) — fine for tens of users
- Supabase free tier has database size limits (500MB) — likely sufficient for this scale
- You're dependent on two platforms instead of one

---

## 5. Auth: Supabase Auth

### Recommendation: **Supabase Auth** (included with Supabase)

### Why?

| Option | Verdict |
|--------|---------|
| **Supabase Auth** | ✅ **Pick.** Included in Supabase. 50K MAU free. Integrates with RLS for database-level permissions. |
| **Clerk** | Beautiful UI, fastest to ship. But $1,000/mo at 100K MAU — overkill for this scale and expensive if you grow. |
| **Auth.js (NextAuth)** | Requires self-managing sessions, adapters, and callbacks. More work than needed. |
| **Firebase Auth** | Tied to Google ecosystem. Works but you'd have two auth systems if using Supabase for database. |
| **Auth0** | Enterprise-grade. Too complex and expensive for a small team. |

### Reasoning

- **Zero additional cost**: Supabase Auth is included in your Supabase project.
- **Role-based access**: Three roles (Admin, Professor, Student) enforced via JWT claims and RLS policies. No separate role management service needed.
- **Email + password + OAuth**: Students log in with email. Professors can use Google OAuth. All built-in.
- **RLS integration**: A student's JWT contains their user ID. RLS policies automatically filter data so they only see their own classes and payments. No application code needed for authorization.
- **Self-hosting**: If you ever leave Supabase cloud, Supabase Auth runs on your own infrastructure.

### Trade-offs

- UI components are less polished than Clerk's pre-built components
- Fewer OAuth providers than Auth0 (but covers the essentials: Google, email/password)
- Tied to Supabase ecosystem (but that's what you're using anyway)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────┐
│                    USERS                        │
│         (Phone browser, desktop)                │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                 VERCEL                          │
│         Next.js (React 19)                      │
│         Server Components + Client Components   │
│         shadcn/ui + Tailwind CSS                │
│         Mobile-first responsive design          │
└─────────────────────┬───────────────────────────┘
                      │ API calls
                      ▼
┌─────────────────────────────────────────────────┐
│                SUPABASE                         │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Postgres │  │ Auth     │  │ Realtime      │  │
│  │ Database │  │ (Email,  │  │ (WebSocket    │  │
│  │ (RLS)    │  │  OAuth,  │  │  subscriptions│  │
│  │          │  │  Roles)  │  │  for live     │  │
│  │          │  │          │  │  updates)     │  │
│  └─────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────────────────────────────────────┐   │
│  │ Edge Functions (Deno)                    │   │
│  │ - Monthly billing generation             │   │
│  │ - Auto-create class instances            │   │
│  │ - Payment processing webhooks            │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Key Data Model (PostgreSQL)

```sql
-- Core entities
users (id, email, role [admin/professor/student], name, ...)
classes (id, template_id?, professor_id, day_of_week, time, max_students, ...)
class_instances (id, class_id, date, status)  -- auto-generated monthly
groups (id, name, professor_id)  -- student groupings
group_students (group_id, student_id)
applications (id, student_id, class_id, status [pending/accepted/rejected])
payments (id, student_id, amount, type [monthly/per_class], status, date)
payment_items (id, payment_id, class_instance_id, amount)
```

---

## Migration Path

If you outgrow this stack:

1. **Supabase → self-hosted Supabase**: Same code, your own infrastructure
2. **Vercel → Railway/Fly.io**: Move Next.js to any Node.js host
3. **Supabase Auth → Clerk/Auth0**: Swap auth provider, keep RLS policies
4. **PostgreSQL stays**: It's PostgreSQL regardless of who hosts it

---

## Decision Summary

| Question | Answer | Why |
|----------|--------|-----|
| What framework? | Next.js (React 19) | Largest ecosystem, mobile-first components, Vercel integration |
| What backend? | Supabase BaaS | No server to manage, auth+DB+realtime included |
| What database? | PostgreSQL | Relational data, RLS, complex queries |
| What hosting? | Vercel + Supabase | $0–25/mo, zero ops, push-to-deploy |
| What auth? | Supabase Auth | Included, 50K MAU free, RLS integration |

**Bottom line**: This stack lets a 1-2 person team ship a production-ready, mobile-first app in weeks, not months. The total infrastructure cost is $0–25/month. You're not choosing tech for scale — you're choosing tech that stays out of your way while you validate the product.
