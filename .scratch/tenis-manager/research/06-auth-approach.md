# Authentication Research — Tennis Class Management App

## Stack

Next.js (App Router, React 19) + Supabase + Vercel

---

## 1. Supabase Auth + Role-Based Access Control

### How roles work

Supabase Auth uses Postgres RLS. Authentication (who you are) is handled by Supabase Auth, which issues a JWT. Authorization (what you can do) is handled by Row Level Security policies at the database level.

**Three approaches to store roles (from simplest to most robust):**

| Approach | Where role lives | Tamper-safe? | Reflection on role change |
|---|---|---|---|
| `app_metadata` on user | `auth.users.raw_app_meta_data` | Yes (server-only writes) | Next token refresh |
| `custom_access_token_hook` | JWT claim baked at issuance | Yes (hook is server-only) | Next token refresh |
| DB lookup in RLS policy | `user_roles` table | Yes (DB is source of truth) | Immediate |

**Recommendation for this app:** Use `app_metadata.role` directly. This is the simplest approach for 3 roles (admin, professor, student) that rarely change. The role is injected server-side via `supabase.auth.admin.updateUserById()` when an admin creates a user, and it lives in the JWT's `app_metadata.role` claim.

For this small app (3 roles, role changes only when admin reassigns), the hook is overkill. Use the lightweight version:

```sql
-- Read role from JWT in RLS policies
SELECT auth.jwt() -> 'app_metadata' ->> 'role'  -- returns 'admin', 'professor', or 'student'
```

### RLS enforcement

Yes, roles enforced via RLS work. Every table gets policies like:

```sql
CREATE POLICY "Students see own profile"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id
  AND (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'student'
);
```

---

## 2. Account Creation Flow

### Options

| Flow | How it works | Pros | Cons |
|---|---|---|---|
| **Admin creates accounts** | Admin fills form → calls `supabase.auth.admin.createUser()` server-side | No open signup, full control | Admin must enter emails/passwords |
| **Admin sends invites** | Admin calls `inviteUserByEmail()` → user gets email with link to set password | Professional UX, no password sharing | Requires user to have email access to complete |
| **Students self-register** | Sign-up form, then admin approves | Less admin work | Open signup = risk of wrong people joining |

### Recommendation

**Use `inviteUserByEmail()`.** Admin/professor enters the student's email → Supabase sends an invite link → student clicks it and sets their own password. This is the simplest flow because:

- No password-sharing or initial-password-management
- Students confirm their own email address
- Admin doesn't need to know or transmit passwords
- Works as a "welcome" email with a link to set their password
- If email confirmation is enabled, the invite link handles it automatically

Implementation:
```typescript
// Server-side (admin/professor action)
await supabase.auth.admin.inviteUserByEmail('student@email.com', {
  data: { role: 'student', name: 'Juan Pérez' },
  redirectTo: 'https://app.com/auth/set-password'
});
```

---

## 3. Authentication Method

| Method | Pros | Cons |
|---|---|---|
| **Email + Password** | Familiar, instant login, no email dependency for each login | Password resets needed, users forget passwords |
| **Magic Link** | Zero friction, no passwords to manage | Requires checking email every login, email deliverability issues, slower |
| **Google OAuth** | Very simple for users with Google accounts | Only works if everyone uses Google, adds OAuth complexity |

### Recommendation

**Email + Password with a fallback Magic Link option.**

- Students and professors are real people who will log in frequently (weekly classes). Email + password is the fastest login for repeat users.
- Magic link is useful as a "forgot password" or secondary option.
- Google OAuth adds unnecessary complexity for a closed user base.

Supabase supports both simultaneously. Enable both email/password and magic link providers in the dashboard. Users pick their preferred method.

---

## 4. Supabase Auth + Next.js Integration

### Package: `@supabase/ssr`

This is the official, current package (replaces deprecated `@supabase/auth-helpers-nextjs`). It handles:

- Cookie-based session management across server/client boundaries
- Automatic token refresh via middleware
- PKCE flow support
- Works with App Router, Server Components, Server Actions

### Three-client pattern (required)

```
lib/supabase/
├── client.ts    → createBrowserClient (Client Components)
├── server.ts    → createServerClient (Server Components, Server Actions, Route Handlers)
└── middleware.ts → createServerClient (Middleware, for token refresh)
```

### Environment variables

```bash
# Client-safe (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-only (NEVER prefixed with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 5. Session Management & Route Protection

### How it works

- Supabase issues short-lived access tokens (1 hour default) + long-lived refresh tokens (7 days default)
- Both stored as `httpOnly` cookies (not localStorage — this is critical)
- The `@supabase/ssr` middleware auto-refreshes expired tokens on every request

### Route protection

**Middleware (recommended):**

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return supabaseResponse;
}
```

**For role-based routing** (e.g., students can't access admin pages):

```typescript
// In middleware or layout
const { data: { user } } = await supabase.auth.getUser();
const role = user?.app_metadata?.role;

if (role === 'student' && pathname.startsWith('/admin')) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### Key rule

**Always use `getUser()` or `getClaims()` on the server, never `getSession()`.** `getSession()` reads from local storage without re-verifying the JWT. `getUser()` validates against the Auth server. `getClaims()` verifies the JWT signature locally (faster, recommended for most cases).

---

## Summary Recommendation

| Decision | Recommendation |
|---|---|
| **Role storage** | `app_metadata.role` on the user (simplest for 3 roles) |
| **Account creation** | Admin/professor invites via `inviteUserByEmail()` |
| **Auth method** | Email + Password (primary), Magic Link (fallback) |
| **Integration package** | `@supabase/ssr` |
| **Session strategy** | httpOnly cookies via `@supabase/ssr`, auto-refresh in middleware |
| **Route protection** | Next.js middleware + `getUser()` |
| **RLS enforcement** | Yes — policies check `auth.uid()` + `auth.jwt() -> 'app_metadata' ->> 'role'` |
| **Password resets** | Supabase built-in (send email link) |

### What this gives you

- Students click invite link → set password → login with email+password
- Professors/admins created the same way, or have their own admin credentials
- RLS policies enforce "students see only their data, professors see their students, admins see everything"
- Zero custom auth infrastructure — all handled by Supabase + middleware
- Works on Vercel with no special config (serverless-compatible cookie handling)
