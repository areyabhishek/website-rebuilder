# Portfolio Site Rebuilder

Automatically crawl, classify, and rebuild websites by combining the visual language of one domain with the content of another. This tool uses Firecrawl for crawling, Claude 4.5 for classification and generation, and GitHub Actions to create fresh Astro sites.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/areyabhishek/website-rebuilder)

## Features

- **Design Transfer**: Point at a design reference URL and a separate content URL; we fuse them into a new Astro site
- **Smart Classification**: Automatically detects site type (portfolio, blog, SaaS, docs, event, restaurant) for labeling
- **Dynamic Design Tokens**: Extracts fonts, palette, spacing, and key components straight from the reference site
- **GitHub Integration**: Auto-creates issues with blueprint + design system artifacts and triggers PR generation
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
2. Paste a **design source URL** (the site whose look & feel you want)
3. Paste a **content source URL** (the site whose copy/structure you want)
4. Click "Generate"
5. The app:
   - Maps and crawls the design source to extract fonts, color tokens, spacing, and component patterns
   - Maps and crawls the content source (up to 12 pages) to build a detailed blueprint
   - Classifies the content site type for labeling
   - Writes three artifacts to GitHub: blueprint.json, tokens.json, components.json
   - Creates an issue with the `generate-site` label including all artifact links

6. GitHub Action automatically:
   - Fetches blueprint + design system artifacts
   - Prompts Claude Sonnet 4.5 to rebuild the site in Astro using those tokens/components
   - Creates a PR with the generated site
   - Deploys a Vercel preview (if token provided)

### API Endpoints

- `POST /api/generate` - Main generation endpoint
  - Body: `{ designUrl: string, contentUrl: string, limit?: number }`
  - Returns: Job ID, issue URL, artifact URLs

- `GET /api/status/:jobId` - Check job status
  - Returns: Job details, status, links

### Site Categories

The classifier detects these categories:

- **Portfolio**: Personal/agency websites showcasing work
- **Blog**: Content-focused sites with articles/posts
- **SaaS Landing**: Product landing pages with pricing/features
- **Docs**: Documentation sites with guides/API refs
- **Event**: Conference/event sites with schedules/tickets
- **Restaurant**: Restaurant/cafe sites with menus

### Dynamic Design System

For every job we derive:
- Custom fonts (heading + body) from the reference site
- Color palette (brand, alt, background, surface, text, muted)
- Radii, shadows, and spacing scale
- Component guidelines captured in `components.json`
- A plain-language description of the visual language (stored on the job)

## Project Structure

```
portfolio-rebuilder/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── generate/page.tsx     # Main UI
│   │   └── api/
│   │       ├── generate/route.ts # Generation endpoint
│   │       ├── restyle/route.ts  # Styling update endpoint
│   │       └── status/[jobId]/route.ts # Job status endpoint
│   ├── lib/
│   │   ├── allowlist.ts          # Domain checking
│   │   ├── prisma.ts             # DB client
│   │   ├── firecrawl.ts          # Firecrawl integration
│   │   ├── classifier.ts         # Site classification
│   │   ├── blueprint.ts          # Blueprint generator
│   │   ├── design-system.ts      # Dynamic design system extraction
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
