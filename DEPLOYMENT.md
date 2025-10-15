# Deployment Guide

This guide will help you deploy the Portfolio Rebuilder to production so others can test it.

## Quick Start: Deploy to Vercel (5 minutes)

### Prerequisites
1. GitHub account with this repository
2. Supabase account (for PostgreSQL database)
3. API keys ready: Firecrawl, Anthropic, GitHub PAT

### Step-by-Step Instructions

#### 1. Set Up Production Database (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in:
   - **Name**: `portfolio-rebuilder-db`
   - **Database Password**: (generate a strong password and save it)
   - **Region**: Choose closest to your users
4. Wait for database to provision (2-3 minutes)
5. Go to **Settings → Database → Connection String**
6. Copy the **URI** format (it looks like):
   ```
   postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. **Important**: Replace `[PASSWORD]` with your actual database password

#### 2. Update Prisma Schema for Production

Before deploying, you need to switch from SQLite to PostgreSQL:

1. Open `prisma/schema.prisma`
2. Change line 10 from:
   ```prisma
   provider = "sqlite"
   ```
   to:
   ```prisma
   provider = "postgresql"
   ```
3. Commit and push this change:
   ```bash
   git add prisma/schema.prisma
   git commit -m "Switch to PostgreSQL for production"
   git push origin main
   ```

**Note**: If you want to keep SQLite for local development, create two schema files:
- `schema.prisma` (production - PostgreSQL)
- `schema.local.prisma` (development - SQLite)

#### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub

2. Click **"Add New..."** → **"Project"**

3. **Import** your repository:
   - Find `areyabhishek/website-rebuilder`
   - Click **"Import"**

4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)

5. **Add Environment Variables** (click "Environment Variables"):

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your Supabase connection string from Step 1 |
   | `FIRECRAWL_API_KEY` | Your Firecrawl API key |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key |
   | `GITHUB_TOKEN` | Your GitHub Personal Access Token |
   | `GITHUB_REPO` | `areyabhishek/website-rebuilder` |

   **Important**: Make sure all environment variables are set for **Production**, **Preview**, and **Development** environments

6. Click **"Deploy"**

7. Wait 2-3 minutes for deployment to complete

8. You'll get a URL like: `https://portfolio-rebuilder.vercel.app`

#### 4. Initialize Production Database

After deployment, you need to run Prisma migrations on your production database:

1. In Vercel, go to your project → **Settings** → **Environment Variables**

2. Temporarily add a new variable:
   - **Name**: `DIRECT_URL`
   - **Value**: Your Supabase connection string (same as DATABASE_URL)

3. Go to **Deployments** → Click on latest deployment → **"..."** → **"Redeploy"**

4. Once deployed, open your terminal and run:
   ```bash
   # Set your production DATABASE_URL temporarily
   export DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

   # Run Prisma migrations
   npx prisma db push
   ```

   Or use Vercel CLI:
   ```bash
   npm i -g vercel
   vercel env pull .env.production
   npx prisma db push --schema=./prisma/schema.prisma
   ```

#### 5. Test Your Deployment

1. Visit your Vercel URL: `https://portfolio-rebuilder.vercel.app`

2. Go to the generate page: `https://portfolio-rebuilder.vercel.app/generate`

3. Test a dual-source generation:
   - **Design URL**: `https://motherduck.com`
   - **Content URL**: `https://appsmith.com`
   - **Limit**: `3`

4. Check that:
   - GitHub issue is created
   - GitHub Actions runs
   - Preview deployment appears
   - Database records are created

### Troubleshooting

#### Build Fails with "Can't reach database server"
- **Solution**: Make sure `DATABASE_URL` is set in Vercel environment variables
- Redeploy after adding the variable

#### Prisma Client errors
- **Solution**: Run `npx prisma generate` locally and commit the generated files
- Or add build command in Vercel: `npm run build` (which includes `prisma generate`)

#### API routes return 500 errors
- **Solution**: Check Vercel logs (Deployments → click deployment → Runtime Logs)
- Common issues:
  - Missing environment variables
  - Database connection issues
  - API rate limits (Firecrawl, Anthropic)

#### GitHub Actions not triggering
- **Solution**: Make sure `GITHUB_TOKEN` has `repo` and `workflow` scopes
- Go to GitHub → Settings → Developer settings → Personal access tokens
- Regenerate token with correct scopes

### Alternative: Deploy to Railway

If you prefer Railway:

1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select `areyabhishek/website-rebuilder`
4. Railway auto-provisions PostgreSQL (no Supabase needed!)
5. Add environment variables (Railway auto-sets DATABASE_URL)
6. Deploy

Railway provides:
- Built-in PostgreSQL database
- Automatic DATABASE_URL configuration
- Simple CLI for migrations

### Updating Your Deployment

Every time you push to `main`, Vercel automatically deploys the new version.

To deploy a specific branch:
1. Go to Vercel → Settings → Git
2. Enable "Preview Deployments" for all branches
3. Push to any branch to get a preview URL

### Cost Considerations

**Free Tier Limits:**
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Supabase**: 500MB database, 2GB bandwidth, 50MB file storage
- **Firecrawl**: 3 requests/min on free tier (bottleneck!)
- **Anthropic**: Pay-per-use (Claude Sonnet 4: ~$3 per million tokens)

**Recommended Upgrade:**
- Firecrawl Pro ($20/mo) for 50 req/min → allows more users to test simultaneously

### Security Notes

1. **Never commit `.env` files** - they're in `.gitignore`
2. **Use Vercel environment variables** - they're encrypted at rest
3. **Rotate API keys regularly** - especially GitHub PAT
4. **Add rate limiting** - to prevent abuse (not implemented yet)
5. **Consider allowlist** - edit `config/allowlist.json` to restrict domains

### Next Steps

After deployment:
1. Share your Vercel URL with testers
2. Monitor Vercel logs for errors
3. Check Supabase dashboard for database growth
4. Set up custom domain (optional): Vercel → Settings → Domains

---

Need help? Check:
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
