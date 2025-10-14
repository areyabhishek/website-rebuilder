# Vercel Deployment Setup

Your generator app works locally but fails on Vercel because it needs environment variables and database configuration.

## Quick Fix for Vercel

### Step 1: Add Environment Variables in Vercel

Go to your Vercel project settings:
```
https://vercel.com/[your-username]/portfolio-rebuilder/settings/environment-variables
```

Add these environment variables:

```bash
# Required
DATABASE_URL="file:./dev.db"
FIRECRAWL_API_KEY="your-firecrawl-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
GITHUB_TOKEN="your-github-token"
GITHUB_REPO="your-username/repo-name"

# Optional
VERCEL_TOKEN="your-vercel-token"
```

### Step 2: Database Issue

SQLite (`file:./dev.db`) won't work on Vercel because:
- Vercel is serverless (no persistent filesystem)
- Each request runs in a new environment

### Solutions:

**Option A: Use Vercel Postgres (Recommended)**

1. Go to Vercel dashboard → Storage → Create Database → Postgres
2. Copy the `POSTGRES_PRISMA_URL` connection string
3. Update your `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

4. Add to Vercel environment variables:
```
DATABASE_URL="postgres://..."
```

5. Run migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Option B: Use Supabase (Free)**

1. Create account at https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Use same steps as Option A

**Option C: Keep SQLite for Local Only**

If you only want to run this locally, that's totally fine! The Vercel deployment of your generator app isn't necessary - GitHub Actions runs everything.

## Why Your Localhost Works

- ✅ Has `.env` file with all keys
- ✅ Has `dev.db` SQLite database locally
- ✅ Can access filesystem

## Why Vercel Fails

- ❌ No environment variables set
- ❌ SQLite doesn't work on serverless
- ❌ Missing `.env` file (not deployed)

## Recommended Approach

Since the **real site generation happens in GitHub Actions**, not on Vercel, you have two options:

### Option 1: Keep Generator Local Only
- Use localhost for testing and submitting sites
- GitHub Actions does the heavy lifting
- No need to deploy generator to Vercel
- **Simplest approach!**

### Option 2: Deploy Generator to Vercel
- Switch to Postgres/Supabase
- Add all environment variables
- Deploy for public access

**My Recommendation:** Keep it local! The generator is just a UI for creating GitHub issues. The actual magic (site generation + Vercel deployment) happens in GitHub Actions, which already has all your secrets configured.

## Test Your Current Setup

Your motherduck.com generation should:
1. ✅ Create GitHub issue (check repo)
2. ✅ Trigger GitHub Action
3. ✅ Deploy to Vercel (if VERCEL_TOKEN is in GitHub Secrets)
4. ✅ Create PR with preview URL

Check your GitHub repo now to see if the action is running!
