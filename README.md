# Bhuana Garba Mahotsav — Pass Management System

Simple mobile-first tool: admin gives passes to team members → team members sell → admin sees who sold what, on which date, for how much.

Stack: Next.js 14 · TypeScript · Tailwind · PostgreSQL · Prisma 7. Needs Node 20.19+.

## 1. Run on your computer

```bash
npm install
cp .env.example .env        # then edit DATABASE_URL and SESSION_SECRET
npm run db:setup            # creates tables + safety constraints
npm run db:seed             # admin account + demo data
npm run dev                 # http://localhost:3000
```

Logins after seeding
- Admin: `admin` / `admin123`  (use the "Admin Login" tab)
- Team (demo): `rahul`, `amit`, `rohit`, `vikas` / `pass123`  (also login by mobile: 9000000001 ... 9000000004)

Before the event: change the admin password (Admin → Settings), and delete demo members or seed with `SKIP_DEMO=1 npm run db:seed` for a clean start.

## 2. Put it online (easy way)

1. Create a free PostgreSQL database on **Neon** or **Supabase**; copy its connection string.
2. Put the code on GitHub, import it in **Vercel**.
3. In Vercel → Environment Variables add: `DATABASE_URL`, `SESSION_SECRET` (any 32+ random characters), `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
4. On your computer, with the same `DATABASE_URL` in `.env`, run `npm run db:setup` and `SKIP_DEMO=1 npm run db:seed` once.
5. Deploy. Share the link with the team.

## 3. Important rules built in
- A member can never sell more than they have for a date (checked inside one database transaction + a database CHECK constraint).
- Every sale has a unique request id, so a double tap never counts twice.
- Sales cannot be edited or deleted by team members.
- Admin can edit/revoke an allocation, but never below what is already sold.
- Amounts are whole rupees. Event dates and phone numbers live in `lib/event.ts`.

## 4. Tests
```bash
npm run test:logic                              # business rules against the database
npm run build && npm start &                    # then:
BASE=http://localhost:3000 npx tsx scripts/test-http.ts
```
The HTTP test expects the fresh demo data (run it once right after seeding).
