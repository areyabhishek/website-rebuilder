# Quick Start

Get up and running in 5 minutes!

## Prerequisites

You need API keys from:
1. ✅ [Supabase](https://supabase.com) - Database (free tier)
2. ✅ [Firecrawl](https://firecrawl.dev) - Web crawling (free 500 credits)
3. ✅ [Anthropic](https://console.anthropic.com) - Claude AI (needs $5 credit)
4. ✅ [GitHub](https://github.com) - Personal Access Token

## Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Edit the `.env` file with your credentials:

```bash
# Supabase - Get from Settings > Database > Connection String
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"

# Firecrawl - Get from firecrawl.dev dashboard
FIRECRAWL_API_KEY="fc-your-key-here"

# Anthropic - Get from console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-your-key-here"

# GitHub - Generate at Settings > Developer settings > Personal access tokens
GITHUB_TOKEN="ghp_your-token-here"
GITHUB_REPO="your-username/portfolio-rebuilder"
```

### 3. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## First Test

1. Go to [http://localhost:3000/generate](http://localhost:3000/generate)
2. Enter: `https://icyproductions.com`
3. Click **Generate**
4. Wait ~30 seconds
5. A GitHub issue should open with your artifacts! 🎉

## What Happens Next?

1. ✅ Site gets mapped (finds all pages)
2. ✅ Up to 25 pages are crawled
3. ✅ Blueprint is generated (navigation, sections, content)
4. ✅ Site is classified (portfolio, blog, saas, etc.)
5. ✅ Theme tokens are generated
6. ✅ Artifacts are written to GitHub
7. ✅ Issue is created with `generate-site` label
8. ⏳ GitHub Action runs (generates Astro site)
9. ⏳ PR is created with the new site
10. ⏳ Vercel deploys preview

## Troubleshooting

### "Failed to generate site"
- Check browser console for errors
- Verify all API keys are correct
- Ensure domain is in allowlist

### "Database connection failed"
- Run `npx prisma generate` again
- Check DATABASE_URL format
- Ensure Supabase project is active

### GitHub Action doesn't run
1. Push the code to GitHub first:
   ```bash
   git add .
   git commit -m "Initial setup"
   git push
   ```
2. Add `ANTHROPIC_API_KEY` to GitHub Secrets
3. Enable GitHub Actions in repo settings

## Need More Help?

- 📖 See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
- 📚 See [README.md](./README.md) for full documentation
- 🐛 Found a bug? [Open an issue](https://github.com/your-username/portfolio-rebuilder/issues)

## Next Steps

Once everything works locally:
1. 🚀 [Deploy to Vercel](./SETUP_GUIDE.md#step-12-deploy-to-vercel-optional)
2. 🤖 Set up GitHub Actions (see SETUP_GUIDE.md)
3. 🎨 Customize theme packs in `src/lib/theme-packs.ts`
4. 📝 Add more domains to `config/allowlist.json`

Happy rebuilding! 🎉
