# Credentials Checklist

Complete this checklist to finish setting up authentication and payments. Copy each value into your `.env.local` file.

---

## ✅ Credentials You Already Have

- [x] **FIRECRAWL_API_KEY** - From [firecrawl.dev](https://firecrawl.dev)
- [x] **ANTHROPIC_API_KEY** - From [console.anthropic.com](https://console.anthropic.com)
- [x] **GITHUB_TOKEN** - From GitHub Settings → Developer settings → Personal access tokens
- [x] **GITHUB_REPO** - Your repo: `areyabhishek/website-rebuilder`
- [x] **VERCEL_TOKEN** (optional) - From Vercel dashboard

---

## 🔲 New Credentials Needed

### 1. Supabase Credentials (2 values)

**Where to get them:**
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Click **"New Project"**
4. Fill in:
   - **Organization**: Create new or select existing
   - **Project Name**: `portfolio-rebuilder`
   - **Database Password**: Generate and save it (you'll need this later)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
5. Wait 2-3 minutes for project to provision

**Get the credentials:**
1. Go to **Settings** (gear icon) → **API**
2. Copy these values:

```
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
```
Look for: **Project URL**

```
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
Look for: **Project API keys** → **anon** → **public**

**Enable Email Auth:**
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. ✅ Done

---

### 2. Dodo Payments Credentials (4 values)

**Where to get them:**
1. Go to [dodopayments.com](https://dodopayments.com)
2. Sign up for an account
3. Complete KYC verification (if required)

**Create a Product:**
1. Go to **Products** → **Create Product**
2. Fill in:
   - **Name**: `Site Generation Credit`
   - **Price**: `$1.00 USD`
   - **Type**: `One-time payment`
   - **Description**: `Generate one additional website`
3. Click **Create**
4. Copy the **Product ID**:

```
DODO_PRODUCT_ID="prod_xxxxxxxxxxxxxxxxx"
```

**Get API Keys:**
1. Go to **Settings** → **API Keys** (or **Developers** → **API Keys**)
2. Copy these values:

```
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxxxxxx"
```
Look for: **Publishable Key** (starts with `pk_`)

```
DODO_SECRET_KEY="sk_live_xxxxxxxxxxxxxxxxx"
```
Look for: **Secret Key** (starts with `sk_`)
⚠️ **Keep this secret!** Never commit to Git or share publicly.

**Set Up Webhook:**
1. Go to **Developers** → **Webhooks** → **Add Endpoint**
2. Fill in:
   - **URL**: `https://your-vercel-domain.vercel.app/api/webhooks/dodo`
     - For local testing: `https://your-ngrok-url/api/webhooks/dodo`
   - **Events to send**: Select:
     - ✅ `payment.succeeded`
     - ✅ `payment.failed`
3. Click **Create**
4. Copy the **Webhook Secret**:

```
DODO_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxx"
```

---

## 📋 Complete .env.local File

Once you have all credentials, your `.env.local` should look like this:

```bash
# ============================================
# DATABASE
# ============================================
# Local development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL from Supabase)
# DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"


# ============================================
# EXISTING API KEYS (You already have these)
# ============================================
FIRECRAWL_API_KEY="fc-your-key-here"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
GITHUB_TOKEN="ghp_your-token-here"
GITHUB_REPO="areyabhishek/website-rebuilder"
VERCEL_TOKEN="your-vercel-token-here"


# ============================================
# SUPABASE AUTH (2 new values needed)
# ============================================
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"


# ============================================
# DODO PAYMENTS (4 new values needed)
# ============================================
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxxxxxx"
DODO_SECRET_KEY="sk_live_xxxxxxxxxxxxxxxxx"
DODO_PRODUCT_ID="prod_xxxxxxxxxxxxxxxxx"
DODO_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxx"
```

---

## ✅ Verification Steps

After adding all credentials:

### 1. Verify Environment Variables
```bash
# Check that all variables are set
node -e "
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_DODO_PUBLISHABLE_KEY',
  'DODO_SECRET_KEY',
  'DODO_PRODUCT_ID',
  'DODO_WEBHOOK_SECRET'
];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.log('❌ Missing:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ All credentials set!');
}
"
```

### 2. Test Supabase Connection
```bash
# In browser console on your site:
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data } = await supabase.auth.getSession();
console.log('Supabase connected:', data);
```

### 3. Update Production Database
```bash
# Run this to create User and Transaction tables in production
export DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
npx prisma db push --schema=./prisma/schema.production.prisma
```

---

## 🚀 Deploy to Production

Once all credentials are added:

### 1. Add to Vercel
1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Add all 6 new variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DODO_PUBLISHABLE_KEY`
   - `DODO_SECRET_KEY`
   - `DODO_PRODUCT_ID`
   - `DODO_WEBHOOK_SECRET`
3. Select **Production**, **Preview**, and **Development** for each
4. Click **Save**

### 2. Update Webhook URL
1. In Dodo dashboard, edit your webhook
2. Change URL to your Vercel domain:
   ```
   https://your-site.vercel.app/api/webhooks/dodo
   ```

### 3. Redeploy
```bash
git push origin main
```
Or manually redeploy in Vercel dashboard.

---

## 📞 Support Links

- **Supabase Help**: [supabase.com/docs](https://supabase.com/docs)
- **Dodo Payments Help**: [dodopayments.com/docs](https://dodopayments.com/docs)
- **Questions**: Check [AUTH_PAYMENT_SETUP.md](AUTH_PAYMENT_SETUP.md) for detailed setup

---

## ⏱️ Time Estimate

- Supabase setup: **5 minutes**
- Dodo Payments setup: **10 minutes**
- Adding to `.env.local`: **2 minutes**
- Testing: **3 minutes**
- **Total: ~20 minutes**

Once done, you'll be ready to implement the UI components! 🎉
