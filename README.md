# Travel Cart UK: Booking Management Dashboard

An internal dashboard for the Travel Cart UK booking team. Staff create and manage bookings, traveller details, flight information, payment methods and financials, with secure Admin and Agent accounts.

**Live demo:** https://travel-cart-henna.vercel.app/
Demo logins (one Admin and one Agent) are provided separately by email.

## What it does

- Secure sign-in with Admin and Agent roles, and automatic sign-out after 30 minutes of inactivity
- Dashboard with live figures: bookings by type, total sales, total supplier costs and total profit
- Upload New Booking form with one traveller form per passenger, multi-city segments, airport search and a live profit preview
- Automatic booking references in the format `TC-2026-000001`
- Individual booking pages, edit with Last Updated tracking, and delete with confirmation
- Search by reference, customer name, phone or email, with filters, sorting and pagination
- Admin-only User Management: add users, edit details, change roles, reset passwords, activate and deactivate accounts

## Technology stack and why

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React) with TypeScript | One project for pages and API, strong typing, easy to review |
| Styling | Tailwind CSS | Consistent design tokens and responsive layouts |
| Backend | Next.js route handlers (REST) | Same codebase as the frontend, and easy to split into a separate service later |
| Database | PostgreSQL on Neon | A real relational database with foreign keys, constraints, transactions and exact decimals |
| ORM | Prisma | Typed queries, safe parameterised SQL, versioned migrations |
| Validation | Zod | The same rules describe valid users and bookings on the server |
| Passwords | bcrypt (cost 12) | One-way salted hashing |
| Sessions | iron-session | Encrypted, HttpOnly, Secure cookies |
| Money | decimal.js and `NUMERIC(12,2)` | No floating-point arithmetic anywhere near money |
| Hosting | Vercel (London region) and Neon (London) | Simple deployment close to UK users |

## How it fits together

```
Browser (React pages)
   │  fetch("/api/...")
   ▼
API route (server code)
   1. Who are you?          session cookie, then the user is re-read from the database
   2. Are you allowed?      role check (src/lib/permissions.ts)
   3. Is the data valid?    Zod schema
   ▼
Prisma  →  PostgreSQL
```

Every protected request re-checks the user in the database. A deactivated user therefore loses access on their very next request. Permissions are enforced on the server, never only by hiding buttons.

## Folder structure

```
prisma/                 schema.prisma, migrations, seed scripts
src/app/api/            the REST API (auth, users, bookings, dashboard)
src/app/(app)/          pages that need a login, wrapped in the sidebar layout
src/app/(app)/admin/    Admin-only pages (protected by a layout guard)
src/app/login/          the sign-in page
src/components/         reusable UI (sidebar, booking form, tables, dialogs)
src/lib/                shared logic: auth guards, permissions, validation,
                        booking reference and profit calculation
docs/API.md             full API reference
```

## Running it locally

You need Node.js 20 or newer and a PostgreSQL database (a free Neon project works well).

```bash
git clone <repository-url>
cd travelcart-dashboard
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"   # pooled connection
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"     # direct connection, used by migrations
SESSION_SECRET="a-random-string-of-at-least-32-characters"
```

Create the tables, add the first accounts and start the app:

```bash
npx prisma migrate deploy
SEED_ADMIN_PASSWORD="choose-a-strong-password" SEED_AGENT_PASSWORD="choose-another" npx tsx prisma/seed.ts
npm run dev
```

On Windows PowerShell, set the two passwords first with `$env:SEED_ADMIN_PASSWORD = "..."` and `$env:SEED_AGENT_PASSWORD = "..."`, then run the seed command.

Then open http://localhost:3000. The seed creates `admin@travelcart.test` and `agent@travelcart.test`. If you do not set the two password variables, local-only defaults are used, so never run an unconfigured seed against a live database.

Optional sample data: `npx tsx prisma/seed-bookings.ts` creates 30 example bookings.

## Creating additional users

1. Sign in as an Admin and open **User Management**.
2. Click **Add New User**.
3. Enter the full name, a unique email address, a password (at least 8 characters, with upper case, lower case and a number), the matching confirmation and a role.
4. The new user can sign in straight away.

From the same page an Admin can edit names and emails, change roles, reset passwords (existing passwords can never be viewed) and activate or deactivate accounts. The last active Admin cannot be deactivated or demoted.

## Database

| Table | Purpose |
|---|---|
| `User` | Accounts: email (unique), password hash, role, status, last login |
| `Booking` | The booking, customer, journey, money (`NUMERIC(12,2)`), payment method, created by and last updated by (foreign keys to `User`), soft-delete marker |
| `Traveller` | One row per passenger, linked to a booking |
| `FlightSegment` | The legs of a multi-city journey, linked to a booking and ordered |
| `BookingCounter` | One row per year, used to hand out booking references safely |

Booking Profit is stored but always calculated by the server as Total Sold minus Ticket Cost (Supplier). It is never accepted from the client.

## Security measures

- Passwords hashed with bcrypt, never stored or displayed in plain text
- Encrypted HttpOnly session cookie, 30-minute inactivity timeout
- Role and account status checked in the database on every request
- Server-side validation of every input with Zod
- Parameterised queries through Prisma, which prevents SQL injection
- Same error message for an unknown email and a wrong password
- Admin pages guarded by a layout and Admin endpoints guarded by the API
- Financial visibility controlled from one file (`src/lib/permissions.ts`), so it can be restricted for Agents later without other changes

## Known limitations and next steps

- If two people edit the same booking at the same moment, the last save wins. A version number would add conflict detection.
- Phone search matches the number exactly as stored, including spaces.
- The airport list contains about 110 airports. The full OurAirports dataset can replace it without changing the form.
- Child (2 to 12) and Youth (12 to 16) ages overlap at 12, so age categories are not enforced yet.
- Not yet added: login rate limiting, an audit log, automated tests, two-factor sign-in for Admins.
- Designed to extend: payment tracking, invoices, customer and supplier records, document uploads and reporting can be added as new tables linked to `Booking` without changing the existing code.
