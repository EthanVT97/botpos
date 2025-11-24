# 🔧 Fix Registration Issue

## Problem
Registration is failing because the `auth_schema.sql` hasn't been run on your production database yet.

## Quick Fix

### Option 1: Run via Render Shell (Easiest)

1. Go to your database on Render: https://dashboard.render.com
2. Click on your `myanmar-pos-db` database
3. Click **"Connect"** → **"External Connection"**
4. Copy the `psql` command (looks like: `psql postgresql://user:pass@host/db`)
5. Run in your terminal:

```bash
# Connect to database
psql "postgresql://your_connection_string_here"

# Run auth schema
\i supabase/auth_schema.sql

# Verify tables
\dt

# Check users table columns
\d users

# Exit
\q
```

### Option 2: Run SQL Directly

1. Go to Render dashboard → your database
2. Click **"Connect"** → **"External Connection"**
3. Copy the connection string
4. Run this command:

```bash
psql "your_connection_string" -f supabase/auth_schema.sql
```

### Option 3: Manual SQL (if psql not available)

1. Go to Render dashboard → your database
2. Use a PostgreSQL client (DBeaver, pgAdmin, etc.)
3. Connect with the External Database URL
4. Run the contents of `supabase/auth_schema.sql`

## What This Does

The auth schema adds:
- `password_hash` column to users table
- `is_active` column to users table
- `last_login` column to users table
- `refresh_token` column to users table
- `roles` table with permissions
- `sessions` table for session management
- `audit_logs` table for tracking actions
- Default admin user (email: admin@myanmarpos.com, password: admin123)

## After Running the Schema

1. **Test Registration:**
   - Go to: https://myanmar-pos-frontend.onrender.com/register
   - Fill in the form
   - Click "Register"
   - Should redirect to dashboard

2. **Test Login:**
   - Go to: https://myanmar-pos-frontend.onrender.com/login
   - Email: `admin@myanmarpos.com`
   - Password: `admin123`
   - Click "Login"

3. **Change Default Admin Password:**
   - After logging in as admin
   - Go to Settings or Profile
   - Change password from `admin123` to something secure

## Verify It Worked

```bash
# Connect to database
psql "your_connection_string"

# Check if columns exist
\d users

# Should show:
# - password_hash | character varying(255)
# - is_active | boolean
# - last_login | timestamp
# - refresh_token | text

# Check if roles table exists
SELECT * FROM roles;

# Should show 4 roles: admin, manager, cashier, viewer

# Exit
\q
```

## Still Having Issues?

### Error: "User with this email already exists"
- The email is already registered
- Try a different email
- Or login with existing credentials

### Error: "Registration failed"
- Check backend logs on Render
- Verify auth_schema.sql was run successfully
- Check DATABASE_URL environment variable

### Error: "Cannot read property 'password_hash'"
- Auth schema not run yet
- Follow Option 1 or 2 above

## Default Users

After running auth schema, you'll have:

| Email | Password | Role |
|-------|----------|------|
| admin@myanmarpos.com | admin123 | admin |

**⚠️ IMPORTANT: Change the default admin password immediately after first login!**

## Security Notes

1. **Change default password** - The default admin password is publicly known
2. **Use strong passwords** - Minimum 6 characters (recommend 12+)
3. **Limit admin accounts** - Only create admin accounts for trusted users
4. **Regular audits** - Check audit_logs table regularly

## Need Help?

1. Check Render logs for detailed error messages
2. Verify all schemas are run:
   - schema.sql
   - chat_schema.sql
   - bot_flow_schema.sql
   - uom_schema.sql
   - multi_store_schema.sql
   - **auth_schema.sql** ← This one!
   - analytics_schema.sql

---

**After fixing, registration should work perfectly!** 🎉
