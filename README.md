This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install dependencies with `pnpm install` and set `DATABASE_URL` to your PostgreSQL
connection string in `.env.local` (or in the environment).

The Prisma Client is generated automatically before `pnpm dev` and `pnpm build`.
To regenerate it manually after changing `prisma/schema.prisma`, run
`pnpm db:generate`. Generation does not create or migrate database tables.
During development, the cached Prisma Client is replaced when its generated
constructor changes, preventing hot reloads from retaining an outdated schema.

Before starting the app, apply the database migrations:

```bash
pnpm db:migrate
```

This creates the application tables on a new database and
applies pending migrations on an existing one. An account with no ranks returns
an empty list (`[]`), not an error.

## Authentication

The home, `/login` and `/register` are public. All other pages and application
APIs require a local email/password session. The home links to the login form,
which also links to registration. Registration requires a full name, a normalized
unique email, and a matching password of 12–128 characters.

Passwords are salted and hashed with scrypt. Sessions last seven days, use
HttpOnly/SameSite=Lax cookies (Secure in production), and store only a token hash
in PostgreSQL. Logout revokes the session. Login and registration have a
database-backed limit of ten attempts per email per fifteen minutes. Mutating API
requests must send an `Origin` matching the request host and protocol; configure
your production proxy to preserve the external host/protocol and serve HTTPS.
Email verification and password recovery are not implemented.

Game search uses the server-only `LUDOPEDIA_ACCESS_TOKEN` to query Ludopedia's
`/api/v1/jogos` catalog. Users only need a local application session; no personal
Ludopedia connection is required to create or edit tops. The token is never sent
to the browser and does not grant application authentication or ownership of
another user's data. Missing or rejected catalog tokens return an explicit
service-unavailable error; configure or renew the token on the server.

Ludopedia OAuth is optional and only used to recover legacy accounts.
For that flow, configure `LUDOPEDIA_APP_ID` and `LUDOPEDIA_APP_KEY` and register the
`/api/auth/ludopedia/callback` URL with the provider before connecting.
The OAuth flow uses Ludopedia's documented `/oauth` authorization endpoint and
exchanges the code at `/tokenrequest` with `client_id`/`client_secret`. The
callback URL must exactly match the registered origin, port, and path.

Existing Ludopedia users should create a local account, then use **Conectar com
Ludopedia** on their profile to recover their old tops and follow relationships.
Ownership is verified through OAuth, never by matching an email. A Ludopedia
account already linked to another local login cannot be claimed. If both accounts
have a Top 100, linking is rejected without changing either account; remove the
new local Top 100 before recovering the old one.

Run `pnpm test:auth` to check authentication validation, password hashing, safe
redirects, token syntax, and same-origin policy.

## Social feed

After login, `/` shows your own tops and the newest tops created by followed
users, together in reverse chronological order. Visitors still see the public
introduction. Search by full name or username to visit
`/users/[id]`, follow/unfollow a player, and browse their tops. These profiles
require login and never expose email addresses or authentication data.

The feed uses ten-item keyset pages ordered by creation time and ID, loads more
on scroll, and provides a manual loading button. Root comments and each reply
thread are independently paginated. Tops, comments, and replies support
idempotent like/unlike actions. Replies may be nested at multiple levels; visual
indentation is limited on narrow screens, not the reply hierarchy.

Comments are plain text (1–2000 trimmed characters). A reply must belong to the
same top as its parent, enforced by a composite database foreign key. Deleting a
top removes its interactions; verified legacy Ludopedia linking preserves
comments and deduplicates transferred likes and follow relationships.

Apply the additive migration with `pnpm db:migrate`, regenerate with
`pnpm db:generate`, and run `pnpm test:social` for social input, feed-filter, and
cursor validation.

## User profile

The profile belongs to the authenticated local account. After signing in,
the user can edit their locally stored username, email, full name, and HTTPS
profile-image URL. The username must be unique; the email is required and updates
the login email atomically. The other profile fields may be cleared.

The profile displays the user's existing tops and counts of relationships stored
in the application's database. Follow/unfollow actions on player profiles update
these counts and the home feed without requiring a full page reload.
Run `pnpm db:migrate` after updating to create the profile columns and follow
table without removing existing users or ranks. Restart the development server
after applying migrations and regenerating the Prisma Client so it uses the
updated schema.

Run `pnpm test:profile` to check profile validation and OAuth return paths.

## Running the app

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Responsive layout

The mobile menu stays fixed below the `lg` breakpoint, with a viewport-limited
width and safe-area spacing. The root layout reserves space below page content
so the menu does not cover the last controls. The header stays in normal flow,
and page padding adapts to the screen size.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
