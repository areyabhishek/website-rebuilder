# Deployment Guide - Share Your Portfolio Rebuilder

This guide will help you deploy your portfolio rebuilder app so others can use it.

## Current Setup
- ✅ Generated sites auto-deploy to Vercel (working)
- ⚠️ Generator app only runs on localhost (needs deployment)

## Quick Deployment (5-10 minutes)

### Step 1: Choose a Database

Your app currently uses SQLite, which doesn't work on Vercel. Choose one:

#### Option A: Vercel Postgres (Recommended)
1. Go to https://vercel.com/dashboard
2. Select "Storage" → "Create Database" → "Postgres"
3. Copy the `POSTGRES_PRISMA_URL` connection string
4. Cost: Free tier available, then $0.25/month

#### Option B: Supabase (Free, Generous)
1. Go to https://supabase.com → Create account
2. Create new project
3. Settings → Database → Copy "Connection Pooling" URL
4. Cost: Free forever for small projects

### Step 2: Update Environment Variables

Create or update `.env.local` with your database URL:

```bash
# Database (use Vercel Postgres or Supabase URL)
DATABASE_URL="postgresql://user:password@host/database"

# Existing variables
FIRECRAWL_API_KEY="your-firecrawl-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GITHUB_TOKEN="your-github-token"
GITHUB_REPO="your-username/repo-name"
VERCEL_TOKEN="your-vercel-token"
```

### Step 3: Run Database Migration

```bash
# Generate Prisma client with new Postgres schema
npx prisma generate

# Create tables in your Postgres database
npx prisma db push

# Verify it worked
npx prisma studio
```

### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No (first time)
# - What's your project's name? portfolio-rebuilder
# - In which directory is your code? ./
# - Override settings? No
```

### Step 5: Add Environment Variables in Vercel

After deployment, add environment variables:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable:

```
DATABASE_URL = postgresql://your-database-url
FIRECRAWL_API_KEY = your-key
ANTHROPIC_API_KEY = your-key
GITHUB_TOKEN = your-token
GITHUB_REPO = username/repo-name
VERCEL_TOKEN = your-token
```

5. Redeploy: `vercel --prod`

### Step 6: Test Your Deployment

1. Visit your Vercel URL: `https://portfolio-rebuilder-xyz.vercel.app`
2. Go to `/generate` page
3. Submit a test site
4. Check that it creates a GitHub issue
5. Verify the GitHub Action runs
6. Check for Vercel preview URL in the issue comment

## Share Your App

Once deployed, share your Vercel URL with others:
```
https://your-project.vercel.app
```

They can:
1. Visit your site
2. Go to `/generate` to create new sites
3. View generated sites at `/sites`
4. Track progress in real-time

## Cost Breakdown

**Free Option (Recommended for testing):**
- Vercel Hosting: Free (Hobby plan)
- Supabase Postgres: Free (500MB database, 2GB bandwidth)
- Total: $0/month

**Paid Option (For production):**
- Vercel Pro: $20/month (better limits)
- Vercel Postgres: $0.25/month
- Total: ~$20/month

## Troubleshooting

### Issue: Database connection fails
**Solution:** Check that your `DATABASE_URL` is correct and includes connection pooling

### Issue: Environment variables not working
**Solution:** Make sure you added them in Vercel dashboard AND redeployed

### Issue: GitHub Actions not triggering
**Solution:** Verify `GITHUB_TOKEN` has correct permissions (repo, issues, workflows)

### Issue: Sites not deploying to Vercel
**Solution:** Check that `VERCEL_TOKEN` is set in both:
- GitHub repository secrets
- Vercel environment variables

## Alternative: Keep Local Only

If you prefer, you can keep the generator local and just share generated site URLs:
- Run `npm run dev` locally
- Generate sites through localhost:3001
- Share the Vercel preview URLs with others
- They can view the generated sites directly

This way you don't need to deploy the generator at all!

## Need Help?

Common issues and solutions:
1. Check Vercel deployment logs
2. Test database connection with `npx prisma studio`
3. Verify all environment variables are set
4. Check GitHub Actions logs for generation issues
