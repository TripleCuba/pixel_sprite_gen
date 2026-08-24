This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:8080](http://localhost:8080) with your browser to see the result.

## Image generation setup

Copy `.env.example` to `.env.local` and add an OpenAI API key:

```bash
OPENAI_API_KEY=your_key_here
```

The key is read only in the server-side sprite route and is never sent to the browser. The generator requests a 1024×1024 image on a flat chroma-green background, removes the connected green background, quantizes the result to a 32-colour palette, and exports a transparent 256×256 PNG on a 64×64 logical pixel grid.

## Google sign-in setup

Sprite generation is available only to signed-in users. Create a Google OAuth web client in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), then add these values to `.env.local`:

```bash
AUTH_SECRET=replace_with_a_random_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
ALLOWED_EMAILS=your-google-email@example.com
```

Create the secret with `npx auth secret` (or use another cryptographically secure random value). In your Google OAuth client's **Authorized redirect URIs**, add:

```text
http://localhost:8080/api/auth/callback/google
```

For production, add the matching `https://your-domain.com/api/auth/callback/google` URI too. Restart the development server after changing `.env.local`.

`ALLOWED_EMAILS` is a comma-separated server-side allowlist. An email must be listed to sign in, view `/generator`, or call the generation API. This is intended for private testing only; add per-user usage limits and billing before allowing the public to generate sprites.

## Generated image storage

Generated PNG files are stored in a private Supabase Storage bucket and their metadata is stored in Supabase Postgres. New users start on the `free` plan with a 100 MiB storage limit. The generated-image route fails closed until storage is configured, preventing any OpenAI request from being made without a place to save its result.

1. Create a [Supabase project](https://supabase.com/dashboard/projects).
2. Open its **SQL Editor** and run [the storage migration](./supabase/migrations/20260824000000_add_sprite_storage.sql). It creates the private `generated-sprites` bucket, tables, quota functions, and server-only permissions.
   Then run [the quota-function patch](./supabase/migrations/20260824000001_fix_sprite_storage_quota_function.sql), followed by [the generation-credit migration](./supabase/migrations/20260824000002_add_generation_credits.sql).
3. Add these server-only values to `.env.local` and Vercel:

   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_server_only_secret_key
   ```

Find both under **Supabase → Project Settings → API**. Use the `service_role` or secret server key only on the server; never expose it in `NEXT_PUBLIC_*` variables or browser code.

## Generation credits

Every user starts with 20 credits. Low, Medium, and High quality generation cost 1, 10, and 40 credits respectively. Credits are reserved before OpenAI receives a request and refunded automatically if image generation or storage fails. The balance is enforced on the server; the browser only displays it.

Subscription billing and recurring credit top-ups can be added later without changing the generation endpoint.

## Deployment

This is a server-rendered Next.js app: deploy it to a Node.js-compatible platform rather than GitHub Pages. The repository includes a GitHub Actions workflow that runs lint and a production build for every push and pull request.

### Vercel

1. Import the `TripleCuba/pixel_sprite_gen` repository at [Vercel](https://vercel.com/new).
2. Keep the detected build command: `npm run build`.
3. In **Project Settings → Environment Variables**, add these values for Production (and Preview if you need sign-in there):

   ```text
   OPENAI_API_KEY
   AUTH_SECRET
   AUTH_GOOGLE_ID
   AUTH_GOOGLE_SECRET
   ALLOWED_EMAILS
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ```

4. Deploy the project and copy its production URL.
5. In Google Cloud Console, update the OAuth client with the deployed origin and callback URL:

   ```text
   https://your-domain.com
   https://your-domain.com/api/auth/callback/google
   ```

Never place these values in GitHub Actions variables, repository files, or client-side `NEXT_PUBLIC_*` variables. They are server-only secrets.

## Third-party software

Third-party attribution and license notices are collected in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md). Keep the relevant notice with every distribution that bundles the corresponding source code, WebAssembly, or executable.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
