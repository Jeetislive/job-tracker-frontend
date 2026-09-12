# Deploying JobTrack Frontend (Next.js)

Two recommended deployment paths.

### Option A: Vercel (Recommended — easiest)

1. Push the repo to GitHub
2. Import this repo on [vercel.com](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`
   - `NEXT_PUBLIC_APP_NAME` = `JobTrack`
4. Deploy — Vercel auto-detects Next.js

The included `.github/workflows/deploy.yml` builds a Docker image and pushes it to GHCR.
You can also enable Vercel GitHub integration for automatic deploys on push.

### Option B: Docker on EC2

The included `Dockerfile` produces a standalone Next.js image:

```bash
docker build -t jobtrack-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  jobtrack-frontend
```

Route traffic through Nginx (reverse proxy on port 80/443) with SSL via Let's Encrypt.

### Required GitHub Secrets (for Docker deploy)

- `EC2_HOST` — your EC2 public IP / domain
- `EC2_USER` — usually `ubuntu`
- `EC2_SSH_KEY` — contents of your `.pem` file