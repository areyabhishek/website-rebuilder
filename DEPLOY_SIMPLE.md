# Simple Deployment Guide (Vercel + Supabase)

**Goal**: Deploy your site so others can test it without breaking local development.

**Strategy**: Keep SQLite locally, use PostgreSQL (Supabase) in production only.

---

## Prerequisites (Get these ready first)

- [ ] GitHub account (you have this ✅)
- [ ] Vercel account ([vercel.com](https://vercel.com) - sign up with GitHub)
- [ ] Supabase account ([supabase.com](https://supabase.com) - sign up free)
- [ ] Your API keys: Firecrawl, Anthropic, GitHub PAT

---

## Part 1: Set Up Supabase Database (5 minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Organization**: Create one or select existing
   - **Name**: `portfolio-rebuilder`
   - **Database Password**: Click "Generate a password" and **SAVE IT SECURELY** (you'll need this!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Get Database Connection String

1. In your Supabase project, go to **Settings** (gear icon on left sidebar)
2. Click **Database**
3. Scroll down to **Connection string**
4. Select **"URI"** tab
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the actual password you saved in Step 1

### Step 3: Initialize Database Schema

1. Open your terminal in the project folder
2. Set the database URL temporarily (replace with your actual connection string):
   ```bash
   export DATABASE_URL="postgresql://postgres.xxxxx:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   ```

3. Run Prisma migration using the **production schema**:
   ```bash
   npx prisma db push --schema=./prisma/schema.production.prisma
   ```

4. You should see:
   ```
   ✔ Generated Prisma Client
   Database synchronized with Prisma schema
   ✓ Created tables: Job, Page
   ```

5. Verify in Supabase:
   - Go to **Table Editor** in Supabase
   - You should see `Job` and `Page` tables

---

## Part 2: Deploy to Vercel (5 minutes)

### Step 1: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find and import `areyabhishek/website-rebuilder`
4. Click **"Import"**

### Step 2: Configure Build Settings

Vercel auto-detects Next.js. Just verify:
- **Framework Preset**: Next.js ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

**Don't click Deploy yet!** We need to add environment variables first.

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add each of these:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | Your Supabase connection string from Part 1 | PostgreSQL URL |
| `FIRECRAWL_API_KEY` | Your Firecrawl API key | Get from firecrawl.dev |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Get from console.anthropic.com |
| `GITHUB_TOKEN` | Your GitHub Personal Access Token | Needs `repo` scope |
| `GITHUB_REPO` | `areyabhishek/website-rebuilder` | Your repo name |

**Important**: For each variable, select all three environments:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 4: Deploy!

1. Click **"Deploy"**
2. Wait 2-4 minutes (Vercel will):
   - Install dependencies
   - Generate Prisma Client (PostgreSQL)
   - Build Next.js app
   - Deploy to edge network
3. You'll get a URL like: `https://portfolio-rebuilder-xxxx.vercel.app`

---

## Part 3: Verify Deployment (2 minutes)

### Test 1: Check Homepage

1. Visit your Vercel URL
2. You should see the Portfolio Rebuilder homepage
3. If you get 500 error, check Vercel logs:
   - Deployments → Click your deployment → Runtime Logs
   - Look for database connection errors

### Test 2: Run a Generation

1. Go to `/generate` on your Vercel URL
2. Enter:
   - **Design URL**: `https://motherduck.com`
   - **Content URL**: `https://appsmith.com`
   - **Limit**: `3`
3. Click "Generate Site"
4. You should see:
   - ✅ Job created successfully
   - ✅ GitHub issue created
   - ✅ GitHub Actions triggered

### Test 3: Check Database

1. Go to Supabase → Table Editor → `Job` table
2. You should see a new row with:
   - `domain`: `appsmith.com`
   - `designDomain`: `motherduck.com`
   - `status`: `issued` (or similar)

---

## Part 4: Share with Others

Your site is now live! Share this URL with testers:

```
https://portfolio-rebuilder-xxxx.vercel.app/generate
```

They can:
1. Enter design + content URLs
2. Get a generated site with design tokens
3. View the GitHub issue and PR

---

## Troubleshooting

### Error: "Can't reach database server"

**Cause**: DATABASE_URL not set or incorrect

**Fix**:
1. Go to Vercel → Settings → Environment Variables
2. Check DATABASE_URL is correct (copy from Supabase again)
3. Redeploy: Deployments → ... → Redeploy

### Error: "Prisma Client not initialized"

**Cause**: Build used wrong schema

**Fix**:
1. Check `package.json` line 7: `"build": "npm run db:generate:prod && next build"`
2. Should use `schema.production.prisma` (PostgreSQL)
3. If wrong, fix and push to GitHub (auto-redeploys)

### Error: "Rate limit exceeded" (Firecrawl)

**Cause**: Free tier is 3 req/min

**Fix**:
1. Wait 60 seconds between tests
2. Or upgrade Firecrawl plan ($20/mo for 50 req/min)

### Local development broke

**Cause**: DATABASE_URL accidentally changed

**Fix**:
1. Check your `.env.local` file still has SQLite:
   ```
   DATABASE_URL="file:./dev.db"
   ```
2. Run `npx prisma generate` (regenerates client for SQLite)
3. Restart dev server: `npm run dev`

---

## What's Different Between Local and Production?

| Aspect | Local (Your Computer) | Production (Vercel) |
|--------|----------------------|---------------------|
| Database | SQLite (`dev.db` file) | PostgreSQL (Supabase) |
| Schema | `prisma/schema.prisma` | `prisma/schema.production.prisma` |
| Build Command | `npm run dev` | `npm run build` (uses prod schema) |
| Data Persistence | Stays on your machine | Shared across all users |

---

## Next Steps

1. **Custom Domain** (optional):
   - Vercel → Settings → Domains
   - Add `yoursite.com`

2. **Monitor Usage**:
   - Vercel Analytics (free)
   - Supabase dashboard (check DB size)

3. **Upgrade if needed**:
   - Firecrawl Pro for more rate limit
   - Vercel Pro for more bandwidth

---

**Need help?** Check the logs:
- Vercel: Deployments → [your deployment] → Runtime Logs
- Supabase: Logs & Reports → Postgres Logs
