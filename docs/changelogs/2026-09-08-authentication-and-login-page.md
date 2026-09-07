# Changelog: 2026-09-08 - Authentication & Login-Only Access (v0.3.2)

## Overview
Implemented authentication with NextAuth (Auth.js v5) for full workspace route protection. All routes are locked behind a dedicated login page. Only the administrator with credentials configured in `.env` (`ADMIN_USERNAME` and `ADMIN_PASSWORD`) can access the workspace. Strict validation with no fallback credentials ensures unauthorized users cannot log in.

---

## Key Improvements

### 1. Dedicated Login Page (`app/login/page.tsx`)
- **Modern Brand Presentation**: Features NestPick's logo icon, application title, and subtitle tailored for light and dark themes.
- **Form Controls & Feedback**:
  - Username and password inputs with Lucide icons.
  - Password reveal toggle button, vertically centered using `inset-y-0` with a pointer cursor.
  - Clean error banner alert for invalid credentials or blank fields.
  - Interactive sign-in button with spinner animation and disabled state during submission.
- **Theme Switcher**: Integrated top-right `ThemeToggle` for switching between dark and light modes.
- **RSC Optimization**: Wrapped login form in a React `<Suspense>` boundary to prevent CSR bailout in Next.js App Router.

### 2. Strict Authentication Engine (`auth.ts`, `app/api/auth/[...nextauth]/route.ts`)
- **NextAuth v5 Integration**: Built with `next-auth@beta` compatible with Next.js 16 and React 19.
- **Strict Credential Validation**:
  - Reads `ADMIN_USERNAME` and `ADMIN_PASSWORD` from environment variables.
  - No fallback strings (no `||` or default user/password), preventing unauthorized access if credentials do not match or if variables are missing.
  - Supports `NEXTAUTH_SECRET` and `AUTH_SECRET`.
- **JWT Session Strategy**: Fast, stateless JSON Web Tokens for session verification.

### 3. Route Protection Proxy (`proxy.ts`)
- Configured Next.js 16's `proxy.ts` (the successor to `middleware.ts`).
- Protects all workspace routes (`/`, `/table`, `/compare`, `/favorites`, `/recents`) and non-auth API endpoints.
- Unauthenticated requests are redirected with HTTP 302 to `/login` with an automatic `callbackUrl` parameter.
- Authenticated users attempting to visit `/login` are automatically redirected back to the dashboard (`/`).

### 4. Sidebar Session & Sign-Out Integration (`components/dashboard/sidebar.tsx`)
- Displayed active user badge in the sidebar footer (`session.user.name` / Authenticated status).
- Added an interactive **Sign Out** button in both expanded and collapsed sidebar modes calling `signOut({ callbackUrl: "/login" })`.

### 5. Environment & Git Tracking Configuration (`.env.example`, `.gitignore`)
- Documented authentication variables in `.env.example`:
  ```env
  ADMIN_USERNAME=my_admin_user
  ADMIN_PASSWORD=my_super_secret_password
  NEXTAUTH_SECRET=your_random_secret_key
  AUTH_SECRET=your_random_secret_key
  ```
- Updated `.gitignore` with `!.env.example` so that example configuration is tracked in repository history while secret `.env` files remain strictly ignored.
