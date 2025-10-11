# Supabase Connection Troubleshooting

## Issue
Unable to connect to Supabase database at: `db.ktqvwwgcxfpmqbafjvhi.supabase.co:5432`

## Possible Causes & Solutions

### 1. Project is Paused (Most Common)
Free tier Supabase projects pause after 7 days of inactivity.

**Solution:**
1. Go to: https://supabase.com/dashboard/project/ktqvwwgcxfpmqbafjvhi
2. If you see a "Resume Project" button, click it
3. Wait 1-2 minutes for the project to wake up
4. Try the connection again

### 2. Verify Connection String
1. Go to: https://supabase.com/dashboard/project/ktqvwwgcxfpmqbafjvhi/settings/database
2. Scroll to "Connection string" section
3. Click "URI" tab
4. Copy the full connection string
5. Replace `[YOUR-PASSWORD]` with: `webscrapper123#` (we'll handle encoding)

The format should be:
```
postgresql://postgres.ktqvwwgcxfpmqbafjvhi:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

Note: Sometimes Supabase uses a different format with connection pooling.

### 3. Check Project Status
Visit your project dashboard:
https://supabase.com/dashboard/project/ktqvwwgcxfpmqbafjvhi

Look for:
- ✅ Green indicator (project active)
- ⏸️ Paused indicator (needs resume)
- 🔴 Red indicator (issue)

### 4. Use Connection Pooler (Alternative)
Supabase has two connection modes:
- **Direct**: `db.ktqvwwgcxfpmqbafjvhi.supabase.co:5432` (Session mode)
- **Pooler**: `aws-0-us-west-1.pooler.supabase.com:6543` (Transaction mode)

For Prisma, we should use the **Session mode** (direct connection).

## Next Steps

1. **Check if project is paused** - Visit the dashboard
2. **Verify the connection string** - Copy from Supabase settings
3. **Update .env if needed** - Use the exact string from Supabase
4. **Test again** - Run `npx prisma db push`

## Manual Test (Optional)

You can test the connection manually using `psql` if you have it installed:

```bash
psql "postgresql://postgres:webscrapper123%23@db.ktqvwwgcxfpmqbafjvhi.supabase.co:5432/postgres"
```

If this fails with the same error, it confirms the issue is with Supabase project status.
