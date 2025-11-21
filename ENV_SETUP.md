# Environment Variables Setup

## ✅ Files Created

The following `.env.local` files have been created with your provided values:

- `apps/web/.env.local` - Web app environment variables
- `apps/admin/.env.local` - Admin app environment variables

## 🔑 Current Configuration

### Supabase
- **URL**: `https://akjgphgaisyhumgmaeqo.supabase.co`
- **Anon Key**: Configured in both apps
- **Service Role Key**: ⚠️ **NEEDS TO BE ADDED** to `apps/admin/.env.local`

### Google OAuth
- **Client ID**: `988898868785-dajalt9mqvoaqur28ms64rn791qovnq3.apps.googleusercontent.com`

## ⚠️ Next Steps

1. **Add Service Role Key to Admin App:**
   - Open `apps/admin/.env.local`
   - Replace `your-service-role-key-here` with your actual service role key
   - Get it from: Supabase Dashboard > Settings > API > service_role key

2. **Configure Google OAuth in Supabase:**
   - Go to Supabase Dashboard > Authentication > Providers
   - Enable Google provider
   - Add your Google Client ID and Client Secret
   - Set redirect URL: `http://localhost:3001/auth/callback` (for admin)
   - Set redirect URL: `http://localhost:3000/auth/callback` (for web)

3. **Verify Environment Variables:**
   ```bash
   # Check web app
   cat apps/web/.env.local
   
   # Check admin app
   cat apps/admin/.env.local
   ```

## 🔒 Security Notes

- `.env.local` files are gitignored (not committed to repository)
- Never commit service role keys or secrets
- Service role key should ONLY be used in server-side code (Server Actions, API Routes)
- Never expose service role key to client-side JavaScript

## 🚀 Testing

After setting up, test the configuration:

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Web app: http://localhost:3000
# Admin app: http://localhost:3001
```

