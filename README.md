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
