# Portfolio Site Rebuilder

Automatically crawl, classify, and rebuild websites with a single URL. This tool uses Firecrawl for crawling, Claude 4.5 for classification and generation, and GitHub Actions to create fresh Astro sites.

## Features

- **One-Click Generation**: Paste a URL, click Generate, get a PR with a new site
- **Smart Classification**: Automatically detects site type (portfolio, blog, SaaS, docs, event, restaurant)
- **Theme-Aware**: Generates appropriate design tokens based on site category
- **GitHub Integration**: Auto-creates issues with artifacts and triggers PR generation
- **Vercel Preview**: Each PR gets an automatic preview deployment

## Prerequisites

1. **Supabase Account** (free tier works)
   - Create a project at [supabase.com](https://supabase.com)
   - Get your database connection string

2. **Firecrawl API Key**
   - Sign up at [firecrawl.dev](https://firecrawl.dev)
   - Get your API key

3. **Anthropic API Key**
   - Sign up at [console.anthropic.com](https://console.anthropic.com)
   - Get your API key

4. **GitHub Personal Access Token**
   - Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Save the token securely

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd portfolio-rebuilder
npm install
```

### 2. Configure Environment Variables

Copy the `.env` file and fill in your credentials:

```bash
# Database - Get from Supabase: Settings > Database > Connection String (URI)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# Firecrawl API
FIRECRAWL_API_KEY="your-firecrawl-key"

# Anthropic API
ANTHROPIC_API_KEY="your-anthropic-key"

# GitHub
GITHUB_TOKEN="your-github-token"
GITHUB_REPO="your-username/portfolio-rebuilder"
```

### 3. Set Up Database

Run Prisma migrations to create your database tables:

```bash
npx prisma generate
npx prisma db push
```

### 4. Configure Allowlist

Edit `config/allowlist.json` to add domains you want to allow:

```json
[
  "yourdomain.com",
  "anotherdomain.com"
]
```

### 5. Set Up GitHub Repository

1. **Create the repository** (if not already created)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/portfolio-rebuilder.git
   git push -u origin main
   ```

2. **Add GitHub Secrets** for the Action:
   - Go to Settings → Secrets and variables → Actions
   - Add `ANTHROPIC_API_KEY` with your Anthropic key
   - `GITHUB_TOKEN` is automatically provided by GitHub Actions

3. **Enable GitHub Issues**:
   - Go to Settings → General → Features
   - Ensure "Issues" is checked

### 6. Connect to Vercel (Optional)

1. Import your repository to Vercel
2. Add the same environment variables in Vercel dashboard
3. Enable PR previews in Vercel settings

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

### User Flow

1. Go to `/generate`
2. Paste a URL from your allowlist
3. Click "Generate"
4. The app:
   - Maps the site (discovers URLs)
   - Crawls up to 25 pages
   - Generates a blueprint (navigation, sections, content)
   - Classifies the site type
   - Generates theme tokens
   - Writes artifacts to GitHub
   - Creates an issue with the `generate-site` label

5. GitHub Action automatically:
   - Reads the blueprint and tokens
   - Calls Claude to generate Astro site files
   - Creates a PR with the generated site
   - Vercel deploys a preview

### API Endpoints

- `POST /api/generate` - Main generation endpoint
  - Body: `{ url: string, limit?: number }`
  - Returns: Job ID, issue URL, artifact URLs

- `GET /api/job/[id]` - Check job status
  - Returns: Job details, status, links

### Site Categories

The classifier detects these categories:

- **Portfolio**: Personal/agency websites showcasing work
- **Blog**: Content-focused sites with articles/posts
- **SaaS Landing**: Product landing pages with pricing/features
- **Docs**: Documentation sites with guides/API refs
- **Event**: Conference/event sites with schedules/tickets
- **Restaurant**: Restaurant/cafe sites with menus

### Theme Packs

Each category has a unique theme with:
- Custom fonts (heading + body)
- Color palette (brand, bg, surface, text, muted)
- Border radii (sm, md, lg)
- Shadows (sm, md)
- Spacing scale
- Component styles (button, card, menu)

## Project Structure

```
portfolio-rebuilder/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── generate/page.tsx     # Main UI
│   │   └── api/
│   │       ├── generate/route.ts # Generation endpoint
│   │       └── job/[id]/route.ts # Job status endpoint
│   ├── lib/
│   │   ├── allowlist.ts          # Domain checking
│   │   ├── prisma.ts             # DB client
│   │   ├── firecrawl.ts          # Firecrawl integration
│   │   ├── classifier.ts         # Site classification
│   │   ├── blueprint.ts          # Blueprint generator
│   │   ├── theme-packs.ts        # Theme token generator
│   │   └── github.ts             # GitHub API client
│   └── types/
│       └── index.ts              # TypeScript types
├── scripts/
│   └── generator.mjs             # GitHub Action script
├── .github/
│   └── workflows/
│       └── generate-site.yml     # GitHub Action
├── config/
│   └── allowlist.json            # Allowed domains
├── prisma/
│   └── schema.prisma             # Database schema
└── .env                          # Environment variables
```

## Troubleshooting

### Database Connection Issues

If you get Prisma connection errors:
- Verify your Supabase connection string is correct
- Ensure Supabase project is not paused
- Run `npx prisma generate` again

### Firecrawl API Errors

If crawling fails:
- Check your API key is valid
- Verify you haven't exceeded your rate limit
- Check that the URL is accessible

### GitHub Action Not Triggering

If the action doesn't run:
- Verify the issue has the `generate-site` label
- Check that GitHub Actions are enabled in repo settings
- Review the Actions tab for error logs

### Generated Site Issues

If the generated site has problems:
- Check that artifacts (blueprint.json and tokens.json) are valid
- Review the GitHub Action logs
- Verify the Anthropic API key has sufficient credits

## Cost Estimates

For a typical 10-page site:
- **Firecrawl**: ~$0.10 (map + crawl)
- **Anthropic**: ~$0.20 (classification + generation)
- **Supabase**: Free tier
- **GitHub**: Free
- **Vercel**: Free tier

## Future Enhancements

- [ ] Manual page picker before crawl
- [ ] Live progress updates with WebSockets
- [ ] More theme packs and customization
- [ ] CMS integration
- [ ] Form/cart support
- [ ] Multi-language support

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Database**: PostgreSQL (Supabase) via Prisma
- **APIs**: Firecrawl, Anthropic Claude 4.5, GitHub REST API
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
