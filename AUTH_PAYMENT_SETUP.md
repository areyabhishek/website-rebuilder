# Authentication & Payment Setup Guide

This guide will help you set up Supabase authentication and Dodo Payments for the credit system.

## Overview

**Features:**
- User authentication via Supabase Auth
- 2 free site generations per user
- $1 per additional site (via Dodo Payments)
- User dashboard showing all created sites
- Credit balance tracking

---

## Part 1: Supabase Authentication Setup

### Step 1: Enable Email Auth in Supabase

1. Go to your Supabase project → **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Confirmation email
   - Magic link email
   - Password reset email

### Step 2: Get Supabase Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key

### Step 3: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Existing variables
DATABASE_URL="file:./dev.db"
FIRECRAWL_API_KEY="your-firecrawl-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GITHUB_TOKEN="your-github-token"
GITHUB_REPO="areyabhishek/website-rebuilder"
```

### Step 4: Update Database Schema

Run Prisma migration to create user tables:

```bash
npx prisma db push
```

This will create:
- `User` table (with email, credits, supabaseId)
- `Transaction` table (payment history)
- Updated `Job` table (linked to users)

---

## Part 2: Dodo Payments Setup

### Step 1: Create Dodo Payments Account

1. Go to [dodopayments.com](https://dodopayments.com)
2. Sign up for an account
3. Complete KYC verification

### Step 2: Create a Product

1. Go to **Products** → **Create Product**
2. Set up your credit product:
   - **Name**: "Site Generation Credit"
   - **Price**: $1.00 USD
   - **Type**: One-time payment
   - **Description**: "Generate one additional website"

3. Copy the **Product ID**

### Step 3: Get API Keys

1. Go to **Settings** → **API Keys**
2. Copy:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

### Step 4: Add Dodo Environment Variables

Add to `.env.local`:

```bash
# Dodo Payments
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY="pk_your_key_here"
DODO_SECRET_KEY="sk_your_secret_key_here"
DODO_PRODUCT_ID="prod_your_product_id"
DODO_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### Step 5: Set Up Webhook

1. In Dodo dashboard, go to **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. Enter URL: `https://your-domain.com/api/webhooks/dodo`
4. Select events:
   - `payment.succeeded`
   - `payment.failed`
5. Copy the **Webhook Secret** and add to `.env.local`

---

## Part 3: How the System Works

### Credit System Flow

1. **New User Signs Up**:
   ```
   User registers → Supabase Auth → Create User in DB with 2 credits
   ```

2. **User Generates Site**:
   ```
   User clicks Generate → Check credits
   - If credits > 0: Generate site, deduct 1 credit
   - If credits = 0: Show payment modal
   ```

3. **User Buys Credits**:
   ```
   User clicks Buy → Dodo Payment → Webhook → Add credit to user
   ```

4. **User Views Sites**:
   ```
   Dashboard → Show all sites by user → Display remaining credits
   ```

### Database Schema

```prisma
model User {
  id            String   @id
  email         String   @unique
  supabaseId    String   @unique
  credits       Int      @default(2)  // Starts with 2 free
  jobs          Job[]
  transactions  Transaction[]
}

model Job {
  id       String  @id
  domain   String
  userId   String?  // Linked to user
  user     User?
  // ... other fields
}

model Transaction {
  id        String  @id
  userId    String
  amount    Float   // $1.00
  credits   Int     // 1 credit per purchase
  paymentId String  // Dodo payment ID
  status    String  // completed, pending, failed
}
```

---

## Part 4: Next Steps to Implement

The infrastructure is set up. Now you need to:

### 1. Create Auth UI Components

**Files to create:**
- `src/app/login/page.tsx` - Login page
- `src/app/signup/page.tsx` - Signup page
- `src/components/AuthButton.tsx` - Login/Logout button
- `src/components/ProtectedRoute.tsx` - Auth wrapper

### 2. Update Generate API

**File:** `src/app/api/generate/route.ts`

Add credit checking:
```typescript
// 1. Get authenticated user
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// 2. Check user credits
const dbUser = await prisma.user.findUnique({
  where: { supabaseId: user.id },
});

if (!dbUser || dbUser.credits < 1) {
  return NextResponse.json(
    { error: "Insufficient credits. Please purchase more." },
    { status: 402 }
  );
}

// 3. Deduct credit
await prisma.user.update({
  where: { id: dbUser.id },
  data: { credits: { decrement: 1 } },
});

// 4. Create job linked to user
const job = await prisma.job.create({
  data: {
    domain,
    userId: dbUser.id,
    status: "new",
  },
});
```

### 3. Create Payment Webhook

**File:** `src/app/api/webhooks/dodo/route.ts`

Handle Dodo payment webhooks:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("dodo-signature");
  const body = await request.json();

  // Verify webhook signature
  // ... verification logic

  if (body.event === "payment.succeeded") {
    // Add credit to user
    await prisma.transaction.create({
      data: {
        userId: body.metadata.userId,
        amount: 1.00,
        credits: 1,
        paymentId: body.id,
        status: "completed",
      },
    });

    await prisma.user.update({
      where: { id: body.metadata.userId },
      data: { credits: { increment: 1 } },
    });
  }

  return NextResponse.json({ received: true });
}
```

### 4. Create User Dashboard

**File:** `src/app/dashboard/page.tsx`

Show user's sites and credits:
```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user!.id },
    include: { jobs: true },
  });

  return (
    <div>
      <h1>Your Sites</h1>
      <p>Credits: {dbUser.credits}</p>
      {dbUser.jobs.map(job => (
        <div key={job.id}>
          <h3>{job.domain}</h3>
          <a href={job.previewUrl}>View Site</a>
        </div>
      ))}
    </div>
  );
}
```

### 5. Add Payment Button

**File:** `src/components/BuyCreditsButton.tsx`

Integrate Dodo Payments:
```typescript
'use client';

import { useState } from 'react';

export function BuyCreditsButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    // Call Dodo Payments API
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });

    const { checkoutUrl } = await response.json();
    window.location.href = checkoutUrl;
  };

  return (
    <button onClick={handlePurchase} disabled={loading}>
      {loading ? 'Processing...' : 'Buy 1 Credit ($1)'}
    </button>
  );
}
```

---

## Part 5: Testing Locally

### Test Authentication

1. Start dev server: `npm run dev`
2. Go to `/signup`
3. Create account with email
4. Check Supabase **Authentication** tab for new user
5. Check database for new User record with 2 credits

### Test Site Generation

1. Login to your account
2. Go to `/generate`
3. Generate a site
4. Check credits decreased to 1
5. Generate another site
6. Check credits decreased to 0
7. Try to generate again → Should show "Buy credits" message

### Test Payment (Sandbox Mode)

1. With 0 credits, click "Buy Credits"
2. Complete Dodo test payment
3. Check webhook received
4. Verify credit added to account
5. Generate site successfully

---

## Part 6: Production Deployment

### Vercel Environment Variables

Add all environment variables to Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY
DODO_SECRET_KEY
DODO_PRODUCT_ID
DODO_WEBHOOK_SECRET
DATABASE_URL (PostgreSQL from Supabase)
FIRECRAWL_API_KEY
ANTHROPIC_API_KEY
GITHUB_TOKEN
GITHUB_REPO
```

### Update Dodo Webhook

Change webhook URL to production:
```
https://your-vercel-domain.vercel.app/api/webhooks/dodo
```

### Run Production Migration

```bash
# Connect to production database
export DATABASE_URL="postgresql://..."
npx prisma db push --schema=./prisma/schema.production.prisma
```

---

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Verify webhook signatures** from Dodo Payments
3. **Use Row Level Security (RLS)** in Supabase:
   ```sql
   -- Users can only see their own jobs
   CREATE POLICY "Users can view own jobs"
   ON jobs FOR SELECT
   USING (auth.uid() = user_id);
   ```
4. **Rate limit** the generate API to prevent abuse
5. **Validate** all user inputs

---

## Troubleshooting

### "Unauthorized" error
- Check Supabase URL and anon key
- Verify user is logged in
- Check browser cookies are enabled

### Credits not deducted
- Check database transaction
- Verify Prisma client is updated
- Check API route logs

### Payment not working
- Verify Dodo API keys
- Check webhook secret
- Test in Dodo sandbox mode first
- Check webhook endpoint is public

### User not created after signup
- Check Supabase Auth is enabled
- Verify database schema is up to date
- Check for unique constraint errors

---

## Cost Breakdown

**Per User:**
- 2 free sites (included)
- $1 per additional site

**Your Costs:**
- Firecrawl: ~$0.10 per site (crawling)
- Anthropic: ~$0.20 per site (generation)
- **Total cost**: ~$0.30 per site
- **Profit**: $0.70 per paid site

**Monthly Costs (Fixed):**
- Vercel: Free tier (or $20/mo Pro)
- Supabase: Free tier (or $25/mo Pro)
- Dodo Payments: 2.9% + $0.30 per transaction

---

Need help? Check the code examples above or refer to:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Dodo Payments Docs](https://dodopayments.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
