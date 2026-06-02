# DevLens Production Deployment Guide

## Prerequisites

- Node.js 18+
- Gemini API key ([Google AI Studio](https://aistudio.google.com/app/apikey))
- GitHub token (recommended for rate limits)
- Optional: GitHub OAuth app for private repo login

## Environment Variables

Copy `server/.env.example` to `server/.env`:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com
API_PUBLIC_URL=https://your-domain.com
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash
GITHUB_TOKEN=ghp_...
COOKIE_SECRET=generate-a-long-random-string
GITHUB_CLIENT_ID=       # optional OAuth
GITHUB_CLIENT_SECRET=   # optional OAuth
```

**Security checklist:**
- Never commit `.env` files
- Use a strong random `COOKIE_SECRET` (32+ chars)
- Set `CLIENT_URL` to your exact production origin (HTTPS)
- Rotate API keys if ever exposed

## Docker (recommended)

```bash
docker compose up --build -d
```

App serves on port 5000 (API + static frontend).

## Manual deployment

```bash
npm run install:all
npm run build
cd server && NODE_ENV=production npm start
```

The server serves `client/dist` automatically in production mode.

## GitHub OAuth setup

1. Create OAuth App at https://github.com/settings/developers
2. Authorization callback URL: `https://your-domain.com/api/auth/callback`
3. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

## Reverse proxy (Nginx)

```nginx
server {
  listen 443 ssl;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
  }
}
```

## Health check

`GET /api/health` — use for load balancers and uptime monitoring.
