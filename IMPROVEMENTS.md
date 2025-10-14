# Site Generator Improvements

This document describes the three major improvements made to the portfolio rebuilder system.

## 1. Configurable System Prompt

### Location
[config/generator-prompt.json](config/generator-prompt.json)

### What Changed
- The system prompt is now externalized from the generator script
- Easy to edit without touching code
- Supports variable substitution: `{{domain}}`, `{{siteType}}`, `{{navigation}}`, `{{contentSummary}}`
- Configure model and max tokens in one place

### How to Use
1. Open `config/generator-prompt.json`
2. Edit the `systemPrompt` or `userPromptTemplate` fields
3. Change `model` or `maxTokens` if needed
4. Save the file - changes take effect on next generation

### Example: Change the Model
```json
{
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 16000
}
```

---

## 2. Automatic Preview URLs

### What Changed
- Generated sites are now automatically deployed to Vercel
- Each site gets a unique preview URL
- URLs are displayed in GitHub PR descriptions
- Deployment info stored in database

### Setup Required

#### Add Vercel Token
1. Get a Vercel token from https://vercel.com/account/tokens
2. Add to GitHub Secrets as `VERCEL_TOKEN`
3. Generator script will automatically deploy if token exists

#### Database Schema
The schema has been updated to include:
```prisma
model Job {
  // ... existing fields
  previewUrl   String?
  deploymentId String?
}
```

### How It Works
1. GitHub Action runs generator script
2. Script generates site files
3. If `VERCEL_TOKEN` is set, deploys to Vercel
4. Deployment URL added to PR description
5. URL saved to `deployment-info.json` for GitHub Actions

### Files Modified
- [.github/workflows/generate-site.yml](.github/workflows/generate-site.yml) - Added Vercel token and deployment info
- [scripts/generator.mjs](scripts/generator.mjs) - Added `deployToVercel()` function
- [prisma/schema.prisma](prisma/schema.prisma) - Added preview URL fields

---

## 3. UI for Viewing Sites & Styling Changes

### New Pages

#### `/sites` - All Generated Sites
- Lists all generated sites
- Shows status, category, and preview availability
- Click any site to view details

#### `/sites/[id]` - Site Details
- View full site information
- Click "View Generated Site" to open preview
- Links to GitHub issue, PR, and blueprint
- **Request styling changes with AI**

### Styling-Only Updates

Users can now request styling changes without regenerating the entire site:

1. Navigate to a generated site at `/sites/[id]`
2. Find the "Request Styling Changes" section
3. Enter styling instructions (colors, fonts, animations, etc.)
4. Submit to create a new GitHub issue
5. Generator will apply ONLY CSS changes

#### Example Prompts
- "Use a dark mode color scheme with purple accents"
- "Make the design more minimal and modern"
- "Add gradients and animated hover effects"
- "Change to a warm, vintage aesthetic with sepia tones"

### Files Created
- [src/app/sites/page.tsx](src/app/sites/page.tsx) - Sites list page
- [src/app/sites/[id]/page.tsx](src/app/sites/[id]/page.tsx) - Site detail page
- [src/components/StylingEditor.tsx](src/components/StylingEditor.tsx) - Styling request form
- [src/app/api/restyle/route.ts](src/app/api/restyle/route.ts) - API endpoint

### Styling-Only Prompt
The config file includes a `stylingOnlyPrompt` that:
- Only modifies CSS within `<style>` tags
- Preserves HTML structure and content
- Keeps all text and functionality intact
- Updates only visual styling

---

## Testing the Improvements

### Test Prompt Configuration
```bash
# Edit the config
vim config/generator-prompt.json

# Generate a new site to see changes
# The new prompt will be used automatically
```

### Test Vercel Deployment
```bash
# Set the Vercel token
export VERCEL_TOKEN="your_token_here"

# Run the generator (in GitHub Actions)
# Check PR description for preview URL
```

### Test UI & Styling Changes
```bash
# Start dev server
npm run dev

# Visit http://localhost:3000/sites
# Click on a generated site
# Try requesting a styling change
```

---

## Environment Variables

Add these to your `.env` file:

```bash
# Required for all features
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
GITHUB_TOKEN="ghp_..."
GITHUB_REPO="owner/repo-name"

# Optional: Enable Vercel deployments
VERCEL_TOKEN="..."
```

---

## Architecture

```
User submits URL
    ↓
Generate Blueprint & Tokens
    ↓
Create GitHub Issue
    ↓
GitHub Action triggers
    ↓
Claude generates site files (using config/generator-prompt.json)
    ↓
Deploy to Vercel (if token available)
    ↓
Create PR with preview URL
    ↓
User views site at /sites/[id]
    ↓
User requests styling changes
    ↓
New issue created for styling-only update
```

---

## Future Improvements

- [ ] Support multiple Vercel projects per site
- [ ] Add site versioning and rollback
- [ ] Live preview editing in browser
- [ ] A/B testing different styling approaches
- [ ] Export sites as static files
