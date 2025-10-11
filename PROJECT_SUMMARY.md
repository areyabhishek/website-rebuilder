# Portfolio Site Rebuilder - Project Summary

## What We Built

A complete automated website rebuilding system that:
1. Takes a URL as input
2. Crawls and analyzes the site
3. Generates a blueprint and theme tokens
4. Creates a GitHub issue with artifacts
5. Automatically generates a new Astro site via GitHub Actions
6. Deploys preview via Vercel

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety

### Backend & APIs
- **PostgreSQL (Supabase)** - Database
- **Prisma** - ORM
- **Firecrawl API** - Website crawling
- **Anthropic Claude 4.5** - AI classification & generation
- **GitHub REST API (Octokit)** - Issue & file management

### Infrastructure
- **GitHub Actions** - CI/CD automation
- **Vercel** - Deployment & previews

## File Structure

```
portfolio-rebuilder/
├── .github/
│   └── workflows/
│       └── generate-site.yml        # GitHub Action for site generation
│
├── config/
│   └── allowlist.json               # Allowed domains
│
├── prisma/
│   └── schema.prisma                # Database schema
│
├── scripts/
│   └── generator.mjs                # Claude-powered site generator
│
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Root layout
│   │   ├── generate/
│   │   │   └── page.tsx             # Main generation UI
│   │   └── api/
│   │       ├── generate/
│   │       │   └── route.ts         # POST /api/generate
│   │       └── job/[id]/
│   │           └── route.ts         # GET /api/job/:id
│   │
│   ├── lib/
│   │   ├── allowlist.ts             # Domain validation
│   │   ├── prisma.ts                # Database client
│   │   ├── firecrawl.ts             # Firecrawl integration
│   │   ├── classifier.ts            # Site type classifier
│   │   ├── blueprint.ts             # Blueprint generator
│   │   ├── theme-packs.ts           # Theme token generator
│   │   └── github.ts                # GitHub API integration
│   │
│   └── types/
│       └── index.ts                 # TypeScript definitions
│
├── .env                             # Environment variables
├── README.md                        # Full documentation
├── SETUP_GUIDE.md                   # Step-by-step setup
├── QUICK_START.md                   # 5-minute quick start
└── PROJECT_SUMMARY.md               # This file
```

## Key Features

### 1. Intelligent Crawling
- Maps up to 500 URLs from a site
- Filters out login/cart/admin pages
- Crawls up to 25 selected pages
- Extracts markdown, HTML, and links

### 2. Site Classification
- **Rule-based** detection (fast, accurate)
- **LLM fallback** (when rules fail)
- Categories: Portfolio, Blog, SaaS, Docs, Event, Restaurant

### 3. Blueprint Generation
- Automatic navigation extraction
- Section detection (hero, sections, content)
- Image collection
- URL to slug conversion

### 4. Theme System
- 6 pre-built theme packs
- Category-specific design tokens
- Fonts, colors, spacing, shadows, radii
- Component style guidelines

### 5. GitHub Integration
- Automatic artifact storage
- Issue creation with labels
- GitHub Action automation
- PR generation

### 6. Site Generation
- Claude 4.5 Sonnet for code generation
- Astro framework output
- Mobile-first CSS
- SEO optimization
- 404 & sitemap included

## Workflow

```
User Input (URL)
    ↓
Allowlist Check
    ↓
Firecrawl Map (discover pages)
    ↓
Firecrawl Crawl (get content)
    ↓
Generate Blueprint
    ↓
Classify Site Type
    ↓
Generate Theme Tokens
    ↓
Write to GitHub (artifacts/)
    ↓
Create GitHub Issue
    ↓
[GitHub Action Triggered]
    ↓
Fetch Artifacts
    ↓
Call Claude API
    ↓
Generate Astro Site
    ↓
Create Pull Request
    ↓
Vercel Preview Deploy
```

## API Endpoints

### POST /api/generate
Generate a new site from a URL.

**Request:**
```json
{
  "url": "https://example.com",
  "limit": 25
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "clx123...",
  "issueNumber": 42,
  "issueUrl": "https://github.com/user/repo/issues/42",
  "blueprintUrl": "https://github.com/user/repo/blob/main/artifacts/clx123/blueprint.json",
  "tokensUrl": "https://github.com/user/repo/blob/main/artifacts/clx123/tokens.json"
}
```

### GET /api/job/:id
Check job status.

**Response:**
```json
{
  "id": "clx123...",
  "domain": "example.com",
  "status": "issued",
  "category": "portfolio",
  "pageCount": 15,
  "issueNumber": 42,
  "issueUrl": "...",
  "blueprintUrl": "...",
  "tokensUrl": "...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Database Schema

### Job Table
- `id` - CUID
- `domain` - Domain name
- `status` - new | mapped | crawled | blueprinted | issued | pr_open | failed
- `category` - Site category
- `blueprintUrl` - GitHub URL
- `tokensUrl` - GitHub URL
- `issueNumber` - GitHub issue #
- `prUrl` - Pull request URL
- `createdAt` / `updatedAt` - Timestamps

### Page Table
- `id` - CUID
- `jobId` - Foreign key to Job
- `url` - Page URL (unique)
- `title` - Page title
- `md` - Markdown content
- `html` - HTML content

## Environment Variables

Required for local development:
```bash
DATABASE_URL          # Supabase connection string
FIRECRAWL_API_KEY     # Firecrawl API key
ANTHROPIC_API_KEY     # Anthropic API key
GITHUB_TOKEN          # Personal access token
GITHUB_REPO           # username/repo-name
```

Required for GitHub Actions (Secrets):
```bash
ANTHROPIC_API_KEY     # Same as above
GITHUB_TOKEN          # Auto-provided by GitHub
```

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run setup` - Full setup (install + db setup)

## Theme Packs

### Portfolio (Modern)
- Fonts: Inter
- Colors: Blue/Purple gradient on dark
- Style: Elevated cards, sticky menu

### Blog (Clean)
- Fonts: Merriweather + Source Sans Pro
- Colors: Green/Teal on light
- Style: Bordered cards, minimal buttons

### SaaS (Fresh)
- Fonts: Inter
- Colors: Blue/Green on very dark
- Style: Pill buttons, soft cards

### Docs (Clarity)
- Fonts: Inter
- Colors: Indigo/Purple on light
- Style: Sidebar menu, bordered cards

### Event (Vibrant)
- Fonts: Playfair + Lato
- Colors: Red/Orange on dark
- Style: Elevated cards, sticky menu

### Restaurant (Elegant)
- Fonts: Cormorant + Crimson
- Colors: Brown/Amber on cream
- Style: Soft cards, minimal buttons

## Cost Breakdown (per 10-page site)

- **Firecrawl**: ~$0.10 (map + crawl 10 pages)
- **Anthropic**: ~$0.15 (classification + site generation)
- **Supabase**: Free (under 500MB database)
- **GitHub**: Free
- **Vercel**: Free (100GB bandwidth/month)

**Total per site: ~$0.25**

## Security Features

- ✅ Allowlist-only domains
- ✅ Environment variables for all keys
- ✅ No API keys in client code
- ✅ GitHub token with minimal scopes
- ✅ Rate limiting (via API providers)
- ✅ Input validation
- ✅ SQL injection protection (Prisma ORM)

## Future Enhancements

### Phase 2 (Planned)
- [ ] Manual page selection UI
- [ ] Live progress updates (WebSocket)
- [ ] Custom theme editor
- [ ] More theme packs
- [ ] Brand color extraction from logos

### Phase 3 (Ideas)
- [ ] Form builder integration
- [ ] CMS integration (Contentful, Sanity)
- [ ] E-commerce support
- [ ] Multi-language detection
- [ ] A/B test variations
- [ ] Performance optimization suggestions

## Known Limitations

1. **Page Limit**: Max 25 pages per site (Firecrawl API)
2. **No Forms**: Form handling not implemented
3. **No Auth**: Login/user systems not supported
4. **Single Domain**: One site per generation
5. **Static Only**: No server-side rendering in generated sites

## Testing Checklist

### Local Development
- [ ] All environment variables configured
- [ ] Database connected (Prisma)
- [ ] Firecrawl API working
- [ ] Anthropic API working
- [ ] Can access /generate page
- [ ] Can submit a URL
- [ ] GitHub issue created

### GitHub Integration
- [ ] Repository created
- [ ] Code pushed to main
- [ ] GitHub Actions enabled
- [ ] Secrets configured
- [ ] Action runs on issue label
- [ ] PR created successfully

### Vercel Deployment
- [ ] Project imported
- [ ] Environment variables set
- [ ] Builds successfully
- [ ] PR previews enabled
- [ ] Preview URLs accessible

## Support & Documentation

- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Setup Guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Full Docs**: [README.md](./README.md)
- **Issues**: GitHub Issues tab

## Credits

Built with:
- Next.js by Vercel
- Prisma by Prisma
- Firecrawl by Mendable
- Claude by Anthropic
- Tailwind CSS by Tailwind Labs

## License

MIT License - See LICENSE file
