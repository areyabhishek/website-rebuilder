# Implementation Status: Auth & Payment Integration

## ✅ Completed (Phase 1 & 2)

### Authentication Pages
1. ✅ `/src/app/login/page.tsx` - Login page with Supabase Auth
2. ✅ `/src/app/signup/page.tsx` - Signup page with email/password
3. ✅ `/src/app/api/auth/create-user/route.ts` - Creates user in DB with 2 credits
4. ✅ `/src/app/api/auth/credits/route.ts` - Fetches user credits
5. ✅ `/src/components/AuthButton.tsx` - Shows login/logout + credits

### Database & Infrastructure
- ✅ Prisma schema updated with User, Transaction models
- ✅ Supabase client utilities created
- ✅ Next.js middleware for session refresh
- ✅ Environment variables documented

## 🚧 Remaining Work

### Phase 3: Update Generate API with Credit Checking (15 min)

**File to modify:** `src/app/api/generate/route.ts`

Add at the beginning of the POST handler (after line 10):

```typescript
// Add after imports
import { createClient } from "@/lib/supabase/server";

// Add after line 23 (after parsing body)
// Check authentication
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json(
    { error: "Authentication required. Please login to generate sites." },
    { status: 401 }
  );
}

// Check user credits
const dbUser = await prisma.user.findUnique({
  where: { supabaseId: user.id },
});

if (!dbUser) {
  return NextResponse.json(
    { error: "User record not found. Please contact support." },
    { status: 404 }
  );
}

if (dbUser.credits < 1) {
  return NextResponse.json(
    { error: "Insufficient credits. Purchase more credits to continue.", needsPayment: true },
    { status: 402 }
  );
}

// Deduct credit immediately
await prisma.user.update({
  where: { id: dbUser.id },
  data: { credits: { decrement: 1 } },
});

// Update job creation (line 48) to include userId
const job = await prisma.job.create({
  data: {
    domain: contentDomain,
    designDomain,
    status: "new",
    userId: dbUser.id,  // Add this line
  },
});
```

### Phase 4: Update Generate Page with Auth (10 min)

**File to modify:** `src/app/generate/page.tsx`

1. Import at top:
```typescript
import { AuthButton } from "@/components/AuthButton";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
```

2. Add auth state after line 13:
```typescript
const [user, setUser] = useState<any>(null);
const [credits, setCredits] = useState<number | null>(null);
const supabase = createClient();

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchCredits(session.user.id);
    }
  });
}, []);

const fetchCredits = async (supabaseId: string) => {
  const response = await fetch(`/api/auth/credits?supabaseId=${supabaseId}`);
  const data = await response.json();
  setCredits(data.credits ?? 0);
};
```

3. Update header (line 90) to include AuthButton:
```typescript
<header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
  <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6">
    <span className="text-lg font-semibold tracking-tight">
      Portfolio Site Rebuilder
    </span>
    <AuthButton />  {/* Add this */}
  </div>
</header>
```

4. Update error handling in handleSubmit to show payment needed:
```typescript
// In catch block (line 71)
if (err instanceof Error && err.message.includes("402")) {
  setError("Out of credits! Click 'Buy Credits' to continue.");
} else {
  setError(err instanceof Error ? err.message : "Failed to generate site");
}
```

### Phase 5: Payment System (30 min)

#### 1. Create Payment Checkout API

**File:** `src/app/api/payments/create/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create Dodo Payments checkout
    const response = await fetch("https://api.dodopayments.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DODO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: process.env.DODO_PRODUCT_ID,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/generate?payment=cancelled`,
        metadata: {
          userId: dbUser.id,
          supabaseId: user.id,
          email: user.email,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create checkout session");
    }

    return NextResponse.json({ checkoutUrl: data.url });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}
```

#### 2. Create Webhook Handler

**File:** `src/app/api/webhooks/dodo/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("dodo-signature");

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.DODO_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle payment.succeeded event
    if (event.type === "payment.succeeded") {
      const { metadata, id, amount } = event.data;

      // Add credit to user
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { credits: { increment: 1 } },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: metadata.userId,
          amount: amount / 100, // Convert cents to dollars
          credits: 1,
          paymentId: id,
          status: "completed",
        },
      });

      console.log(`✅ Credit added for user ${metadata.userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
```

#### 3. Create Buy Credits Button

**File:** `src/components/BuyCreditsButton.tsx`

```typescript
"use client";

import { useState } from "react";

export function BuyCreditsButton() {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Redirect to Dodo checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to start payment");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="rounded-2xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
    >
      {loading ? "Loading..." : "Buy 1 Credit ($1)"}
    </button>
  );
}
```

### Phase 6: Dashboard (20 min)

**File:** `src/app/dashboard/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AuthButton } from "@/components/AuthButton";
import { BuyCreditsButton } from "@/components/BuyCreditsButton";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!dbUser) {
    return <div>User not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Portfolio Site Rebuilder
          </Link>
          <AuthButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-8">
          {/* Credits Section */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your Credits</h2>
                <p className="mt-2 text-3xl font-bold text-sky-400">
                  {dbUser.credits} {dbUser.credits === 1 ? "credit" : "credits"} remaining
                </p>
              </div>
              <BuyCreditsButton />
            </div>
          </div>

          {/* Sites Section */}
          <div>
            <h2 className="mb-6 text-2xl font-semibold">Your Generated Sites</h2>
            {dbUser.jobs.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center">
                <p className="text-slate-400">No sites generated yet.</p>
                <Link
                  href="/generate"
                  className="mt-4 inline-block rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  Generate Your First Site
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {dbUser.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{job.domain}</h3>
                        {job.designDomain && (
                          <p className="mt-1 text-sm text-slate-400">
                            Design from: {job.designDomain}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-slate-500">
                          Status: <span className="capitalize">{job.status}</span>
                        </p>
                        <p className="text-xs text-slate-600">
                          Created: {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {job.previewUrl && (
                        <a
                          href={job.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                        >
                          View Site
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
```

## Environment Variables Needed

Add to `.env.local`:

```bash
# Supabase (get from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."

# Dodo Payments (get from Dodo dashboard)
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY="pk_live_..."
DODO_SECRET_KEY="sk_live_..."
DODO_PRODUCT_ID="prod_..."
DODO_WEBHOOK_SECRET="whsec_..."

# App URL (for payment redirects)
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

## Testing Checklist

1. ✅ Signup → Creates user with 2 credits
2. ✅ Login → Shows credits in header
3. ✅ Generate site → Deducts 1 credit
4. ✅ Generate again → Deducts to 0 credits
5. ⏳ Try to generate → Shows "Buy credits" error
6. ⏳ Buy credits → Redirects to Dodo
7. ⏳ Complete payment → Webhook adds credit
8. ⏳ Generate again → Works!
9. ⏳ Dashboard → Shows all sites

## Next Steps

1. Complete Phase 3-6 implementations above
2. Add environment variables to `.env.local`
3. Run database migration: `npx prisma db push`
4. Test locally
5. Deploy to production
6. Update webhook URL in Dodo dashboard

## Estimated Time Remaining: ~1 hour

The authentication foundation is complete! Follow the code snippets above to finish the integration.
