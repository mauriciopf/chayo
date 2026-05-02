# Chayo - Instagram Grid Feed

A modern Instagram feed display built with Next.js 15, React 19, and Tailwind CSS, showcasing posts in a responsive grid layout.

## Features

- 📸 Full-screen Instagram post grid
- 🎨 Responsive layout (1-4 columns based on screen size)
- 🎬 Support for images, videos, and carousel posts
- ⚡ Server-side caching for optimal performance
- 🌙 Dark mode support
- 🔒 Secure token handling (server-side only)

## Getting Started

### Prerequisites

1. **Instagram Business Account** - Convert your Instagram account to a Business Account
2. **Facebook App** - Create a Facebook App and connect it to your Instagram account
3. **Access Token** - Generate a long-lived Instagram User Access Token

### Setup Instagram Graph API

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the Instagram Graph API product
4. Generate a long-lived access token (valid for 60 days)
5. Get your Instagram Business Account ID

For detailed instructions, visit: [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

3. Add your Instagram credentials to `.env.local`:

```env
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token
NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see your Instagram feed

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **React:** 19
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **TypeScript:** 5
- **API:** Instagram Graph API
- **Package Manager:** pnpm

## Project Structure

```
.
├── app/
│   ├── api/instagram/feed/  # Instagram API route handler
│   ├── page.tsx             # Landing page
│   └── layout.tsx           # Root layout
├── components/
│   ├── InstagramGrid.tsx    # Main grid component
│   ├── InstagramPost.tsx    # Individual post card
│   └── LoadingGrid.tsx      # Loading skeleton
├── lib/instagram/
│   ├── client.ts            # Instagram API client
│   └── types.ts             # TypeScript types
└── public/                  # Static assets
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `INSTAGRAM_ACCESS_TOKEN` | Long-lived Instagram User Access Token | Yes |
| `NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID` | Instagram Business Account ID | Yes |

## API Routes

- `GET /api/instagram/feed?limit=25` - Fetch Instagram posts

## Token Refresh

Instagram long-lived tokens expire after 60 days. You'll need to refresh them manually or implement an automatic refresh mechanism.

To refresh your token:
```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={app-id}
  &client_secret={app-secret}
  &fb_exchange_token={current-token}
```

## Deployment

Deploy to [Vercel](https://vercel.com/new) with one click:

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Remember to add your environment variables (`INSTAGRAM_ACCESS_TOKEN` and `NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID`) in the Vercel dashboard.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
