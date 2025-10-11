# Next Steps - Getting Your App Running

## ✅ What's Already Done

The complete application has been built with:
- ✅ Next.js 15 app with TypeScript
- ✅ Prisma database schema (PostgreSQL ready)
- ✅ All API routes implemented
- ✅ UI pages created
- ✅ Firecrawl integration
- ✅ Claude AI integration
- ✅ GitHub API integration
- ✅ Site classifier & blueprint generator
- ✅ Theme token generator with 6 packs
- ✅ GitHub Action workflow
- ✅ Generator script for Astro sites

## 🔧 What You Need to Do

### 1. Get Your API Keys (15 minutes)

Follow these links to get your API keys:

#### Supabase (Database)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the PostgreSQL connection string from Settings > Database
4. Format: `postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:5432/postgres`

#### Firecrawl (Web Crawling)
1. Go to [firecrawl.dev](https://firecrawl.dev)
2. Sign up and get your API key
3. Free tier: 500 credits/month

#### Anthropic (Claude AI)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add $5 credits (required for usage)

#### GitHub (Repository Access)
1. Go to Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Select `repo` scope
4. Copy the token

### 2. Configure Environment Variables (2 minutes)

Edit your `.env` file:

```bash
# 1. Add your Supabase connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-ID].supabase.co:5432/postgres"

# 2. Add your Firecrawl key
FIRECRAWL_API_KEY="fc-your-key-here"

# 3. Add your Anthropic key
ANTHROPIC_API_KEY="sk-ant-your-key-here"

# 4. Add your GitHub token
GITHUB_TOKEN="ghp_your-token-here"

# 5. Set your GitHub repo (create it first if needed)
GITHUB_REPO="your-username/portfolio-rebuilder"
```

### 3. Setup Database (1 minute)

Run this single command:

```bash
npm run setup
```

This will:
- Install all dependencies
- Generate Prisma client
- Push schema to your database

### 4. Create GitHub Repository (2 minutes)

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Portfolio rebuilder"

# Create repo on GitHub, then:
git remote add origin https://github.com/your-username/portfolio-rebuilder.git
git branch -M main
git push -u origin main
```

### 5. Configure GitHub Secrets (1 minute)

1. Go to your repo on GitHub
2. Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key

### 6. Test Locally (2 minutes)

```bash
# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Click "Launch generator" and try with: `https://icyproductions.com`

## 🎯 Success Checklist

### Local Development
- [ ] `.env` file configured with all API keys
- [ ] `npm run setup` completed successfully
- [ ] Dev server running at `http://localhost:3000`
- [ ] Can access landing page
- [ ] Can access `/generate` page
- [ ] Submitted a URL and got a GitHub issue created

### GitHub Setup
- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] `ANTHROPIC_API_KEY` added to repo secrets
- [ ] GitHub Actions enabled (should be by default)
- [ ] Issues enabled in repo settings

### First Complete Flow
- [ ] Submitted URL from `/generate`
- [ ] Saw "Mapping, crawling..." message
- [ ] GitHub issue opened automatically
- [ ] Issue has `generate-site` label
- [ ] Issue contains links to blueprint.json and tokens.json
- [ ] GitHub Action triggered (check Actions tab)
- [ ] Pull request created with generated site

## 🚀 Deploy to Production (Optional)

### Deploy to Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add the same environment variables from `.env`
4. Click Deploy
5. Enable PR previews in project settings

## 📊 Monitoring Your Usage

### API Costs (Approximate)
Per site generation:
- Firecrawl: ~$0.10 (map + crawl)
- Anthropic: ~$0.15 (classify + generate)
- **Total: ~$0.25 per site**

### Free Tier Limits
- **Supabase**: 500MB database (enough for thousands of sites)
- **Firecrawl**: 500 credits/month (~50 sites)
- **Anthropic**: Pay as you go (add credits)
- **GitHub**: Unlimited public repos
- **Vercel**: 100GB bandwidth/month

## 🐛 Troubleshooting

### "Prisma Client Not Found"
```bash
npm run db:generate
```

### "Database Connection Failed"
- Verify DATABASE_URL is correct
- Check Supabase project is active (not paused)
- Ensure password has no special characters (or URL-encode them)

### "Firecrawl API Error"
- Check API key is valid
- Verify you have credits remaining
- Try a different URL

### "GitHub Action Didn't Run"
- Ensure issue has `generate-site` label
- Check Actions are enabled: Settings > Actions > Allow all actions
- Verify `ANTHROPIC_API_KEY` is in repo secrets

### "Generated Site Has Errors"
- Check GitHub Action logs in Actions tab
- Verify Claude API has credits
- Check blueprint.json and tokens.json are valid JSON

## 📚 Documentation

- **Quick Start**: [QUICK_START.md](./QUICK_START.md) - 5-minute setup
- **Setup Guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed instructions
- **Project Summary**: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Architecture overview
- **README**: [README.md](./README.md) - Complete documentation

## 🎨 Customization Ideas

Once everything works, try:
1. Add more theme packs in `src/lib/theme-packs.ts`
2. Customize classification rules in `src/lib/classifier.ts`
3. Add more domains to `config/allowlist.json`
4. Modify the UI in `src/app/generate/page.tsx`
5. Adjust crawl limits in `src/lib/firecrawl.ts`

## 💡 Tips

1. **Start Small**: Test with a simple 5-page site first
2. **Check Logs**: Always check browser console and GitHub Action logs
3. **Monitor Credits**: Keep an eye on your API usage
4. **Save Tokens**: Store your API keys securely (use a password manager)
5. **Allowlist**: Only add domains you own or have permission to crawl

## ✨ You're Ready!

Follow the checklist above, and within 30 minutes you'll have a fully functional portfolio rebuilding system.

If you get stuck:
1. Check the error message carefully
2. Look at the troubleshooting section
3. Review the API provider's documentation
4. Check GitHub Action logs

Happy rebuilding! 🚀

---

**First Test URL**: https://icyproductions.com (already in your allowlist!)
