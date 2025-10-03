# Polymart Deployment Guide

## Prerequisites
- Vercel account
- Clerk account (for authentication)
- Convex account (backend)
- Domain: polymart.xyz

## Step 1: Deploy Convex Backend to Production

1. Navigate to the backend directory:
   ```bash
   cd packages/backend
   ```

2. Deploy to production:
   ```bash
   npx convex deploy --prod
   ```

3. Note down the production Convex URL (e.g., `https://your-prod-deployment.convex.cloud`)

## Step 2: Configure Clerk for Production

1. Go to Clerk Dashboard (https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys**
4. Copy your **Publishable Key** (starts with `pk_live_` or `pk_test_`)
5. In **Domains**, add your production domain:
   - Add `polymart.xyz`
   - Add any other domains/subdomains you'll use

## Step 3: Configure Vercel Project

1. Go to Vercel Dashboard (https://vercel.com/dashboard)
2. Select your polymart project (or create new from GitHub)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:
   ```
   VITE_CONVEX_URL = https://your-prod-deployment.convex.cloud
   VITE_CLERK_PUBLISHABLE_KEY = pk_live_xxxxx
   ```
5. Make sure these are set for **Production** environment

## Step 4: Configure Build Settings

In Vercel project settings → **Build & Development Settings**:
- **Framework Preset**: Other
- **Build Command**: (leave default or use `bun run build`)
- **Output Directory**: `apps/web/dist`
- **Install Command**: `bun install`

Alternatively, use the `vercel.json` that's already in your repo.

## Step 5: Deploy

### Option A: Via Git (Recommended)
1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Configure production deployment"
   git push origin master
   ```
2. Vercel will automatically deploy

### Option B: Via Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel --prod
   ```

## Step 6: Configure Custom Domain

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add `polymart.xyz`
3. Update your DNS records as instructed by Vercel:
   - Usually add an A record or CNAME pointing to Vercel

## Step 7: Make a User an Admin

1. Sign in to your app with the account you want to make admin
2. Go to Convex Dashboard (https://dashboard.convex.dev)
3. Select your production deployment
4. Go to **Data** → **users** table
5. Find your user and click to edit
6. Set `isAdmin` to `true`
7. Save

## Step 8: Verify Deployment

Test these URLs:
- `https://polymart.xyz` - Should show the markets page
- `https://polymart.xyz/polls/create` - Create a poll (requires sign-in)
- `https://polymart.xyz/admin` - Admin panel (requires admin user)
- `https://polymart.xyz/keys` - API key management

## Troubleshooting

### White Screen Issue
- Check browser console for errors
- Verify environment variables are set in Vercel
- Make sure VITE_ variables are set for Production environment
- Redeploy after adding env vars

### Authentication Issues
- Verify Clerk domain is configured
- Check that publishable key matches your Clerk app
- Make sure Convex deployment URL is correct

### Build Fails
- Check build logs in Vercel dashboard
- Verify `vercel.json` configuration
- Make sure all dependencies are in `package.json`

## Production Checklist

- [ ] Convex deployed to production (`npx convex deploy --prod`)
- [ ] Clerk domains configured (polymart.xyz added)
- [ ] Vercel environment variables set (VITE_CONVEX_URL, VITE_CLERK_PUBLISHABLE_KEY)
- [ ] vercel.json configured correctly
- [ ] Custom domain added and DNS configured
- [ ] At least one admin user created
- [ ] Test authentication flow
- [ ] Test poll creation
- [ ] Test betting functionality
- [ ] Test API key creation
- [ ] Test admin features

## Environment Variables Reference

### Frontend (Vercel)
```
VITE_CONVEX_URL=https://your-prod-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
```

These are PUBLIC and embedded in the browser bundle.

### Backend (Convex)
Convex automatically handles authentication with Clerk through the `auth.config.ts` file.
No additional environment variables needed.

## Post-Deployment

### Monitor Your App
- Check Vercel Analytics
- Monitor Convex dashboard for function calls
- Check Clerk dashboard for authentication metrics

### Scaling Considerations
- Convex scales automatically
- Vercel Edge Network handles global distribution
- Monitor usage and upgrade plans as needed
