# Setup Guide

This guide will walk you through setting up the Portfolio Site Rebuilder from scratch.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: portfolio-rebuilder
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for the project to be created (~2 minutes)
5. Once ready, go to **Settings** → **Database**
6. Find "Connection string" section
7. Select **URI** tab
8. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
9. Replace `[YOUR-PASSWORD]` with the password you set in step 3

## Step 2: Get Firecrawl API Key

1. Go to [firecrawl.dev](https://firecrawl.dev)
2. Sign up for an account
3. Go to your dashboard
4. Copy your API key
5. Note: Free tier includes 500 credits/month (enough for ~50 sites)

## Step 3: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up/login
3. Go to **API Keys**
4. Click **Create Key**
5. Give it a name (e.g., "portfolio-rebuilder")
6. Copy the key (starts with `sk-ant-`)
7. Note: You'll need to add credits ($5 minimum)

## Step 4: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **New repository**
3. Name it `portfolio-rebuilder`
4. Keep it **Public** or **Private** (your choice)
5. Don't initialize with README (we already have one)
6. Click **Create repository**

## Step 5: Generate GitHub Personal Access Token

1. Click your profile picture → **Settings**
2. Scroll down to **Developer settings** (bottom left)
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token (classic)**
5. Fill in:
   - **Note**: portfolio-rebuilder
   - **Expiration**: 90 days (or custom)
   - **Select scopes**: Check `repo` (this gives full repo access)
6. Click **Generate token**
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)

## Step 6: Configure Your Local Environment

1. Navigate to the project:
   ```bash
   cd portfolio-rebuilder
   ```

2. Open `.env` in your editor

3. Fill in the values:
   ```bash
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres"
   FIRECRAWL_API_KEY="fc-xxx"
   ANTHROPIC_API_KEY="sk-ant-xxx"
   GITHUB_TOKEN="ghp_xxx"
   GITHUB_REPO="your-username/portfolio-rebuilder"
   ```

   Replace:
   - `YOUR_PASSWORD` with your Supabase password
   - `fc-xxx` with your Firecrawl key
   - `sk-ant-xxx` with your Anthropic key
   - `ghp_xxx` with your GitHub token
   - `your-username` with your GitHub username

## Step 7: Initialize Database

Run these commands:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

You should see: ✅ "Your database is now in sync with your Prisma schema"

## Step 8: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Portfolio rebuilder setup"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/your-username/portfolio-rebuilder.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 9: Configure GitHub Repository

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Secret**: Your Anthropic API key
5. Click **Add secret**

6. Go to **Settings** → **General** → **Features**
7. Ensure **Issues** is checked

## Step 10: Test Locally

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the landing page!

## Step 11: Test the Generate Flow

1. Click "Launch generator"
2. Enter one of your allowlisted URLs (e.g., `https://icyproductions.com`)
3. Click "Generate"
4. Wait ~30-60 seconds
5. A GitHub issue should open in a new tab
6. Check that the issue has:
   - Title: "Rebuild: yourdomain.com"
   - Labels: `generate-site` and the category
   - Links to blueprint.json and tokens.json

## Step 12: Deploy to Vercel (Optional)

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Environment Variables**: Add all from your `.env`:
     - `DATABASE_URL`
     - `FIRECRAWL_API_KEY`
     - `ANTHROPIC_API_KEY`
     - `GITHUB_TOKEN`
     - `GITHUB_REPO`
5. Click **Deploy**
6. Wait for deployment (~2 minutes)
7. Your app will be live at `https://your-project.vercel.app`

## Step 13: Enable PR Previews

1. In Vercel, go to your project
2. Click **Settings** → **Git**
3. Ensure these are enabled:
   - ✅ Automatic Deployments for Production
   - ✅ Preview Deployments
4. Scroll to **Deploy Hooks** (optional for manual triggers)

## Troubleshooting

### "Prisma Client Not Found"
Run: `npx prisma generate`

### "Database Connection Failed"
- Check your DATABASE_URL is correct
- Ensure Supabase project is not paused
- Verify password is correct (no special chars that need encoding)

### "Firecrawl API Error"
- Verify API key is valid
- Check you have credits remaining
- Try a different URL

### "GitHub API Error"
- Ensure token has `repo` scope
- Check GITHUB_REPO format is `username/repo-name`
- Verify token hasn't expired

### "Action Not Running"
- Go to repo **Settings** → **Actions** → **General**
- Ensure Actions are enabled
- Check workflow file is in `.github/workflows/`

## Next Steps

✅ Your Portfolio Rebuilder is now ready!

Try generating a site:
1. Go to `/generate`
2. Enter a URL from your allowlist
3. Click Generate
4. Watch the magic happen!

The GitHub Action will automatically:
- Read your artifacts
- Call Claude to generate an Astro site
- Create a PR
- Deploy a preview on Vercel

## Getting Help

- Check the main [README.md](./README.md)
- Review [GitHub Issues](https://github.com/your-username/portfolio-rebuilder/issues)
- Check GitHub Action logs in the **Actions** tab
