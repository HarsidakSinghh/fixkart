# FixKart Deployment Plan

## ✅ Files Already Created

1. ✅ `.env.example` - Environment variables template
2. ✅ `vercel.json` - Vercel deployment configuration
3. ✅ Updated `README.md` - Deployment instructions

---

## 📋 Deployment Checklist

### Step 1: GitHub Repository Setup
- [ ] 1.1 Create GitHub repository named `fixkart`
- [ ] 1.2 Initialize git in local project
- [ ] 1.3 Add all files and commit
- [ ] 1.4 Push to GitHub

### Step 2: Configure Environment Variables in Vercel
- [ ] 2.1 Connect repository to Vercel
- [ ] 2.2 Add `DATABASE_URL` (MongoDB connection string)
- [ ] 2.3 Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] 2.4 Add `CLERK_SECRET_KEY`
- [ ] 2.5 Add `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] 2.6 Add `CLOUDINARY_API_KEY`
- [ ] 2.7 Add `CLOUDINARY_API_SECRET`
- [ ] 2.8 (Optional) Add email SMTP variables

### Step 3: Database Setup
- [ ] 3.1 Create MongoDB Atlas account (if not exists)
- [ ] 3.2 Create new cluster
- [ ] 3.3 Create database user with password
- [ ] 3.4 Whitelist Vercel IP addresses
- [ ] 3.5 Get connection string and add to Vercel

### Step 4: Clerk Authentication Setup
- [ ] 4.1 Create Clerk account
- [ ] 4.2 Create new application
- [ ] 4.3 Copy publishable and secret keys to Vercel
- [ ] 4.4 Configure redirect URLs:
   - `http://localhost:3000` (dev)
   - `https://fixkart.vercel.app` (prod)

### Step 5: Cloudinary Setup
- [ ] 5.1 Create Cloudinary account
- [ ] 5.2 Get cloud name, API key, and secret
- [ ] 5.3 Add upload preset for unsigned uploads
- [ ] 5.4 Add credentials to Vercel

### Step 6: Deploy & Test
- [ ] 6.1 Trigger first deployment
- [ ] 6.2 Verify build succeeds
- [ ] 6.3 Test authentication flow
- [ ] 6.4 Test database connection
- [ ] 6.5 Test image uploads

---

## 🔗 Useful Links

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| MongoDB Atlas | https://cloud.mongodb.com |
| Clerk Dashboard | https://dashboard.clerk.com |
| Cloudinary | https://cloudinary.com |

---

## 💡 Quick Commands

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit: FixKart Admin Dashboard"
git branch -M main

# Add remote (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/fixkart.git

# Push to GitHub
git push -u origin main
```

---

## ⚠️ Important Notes

1. **Never commit `.env.local` to GitHub** - it contains secrets
2. **MongoDB IP Whitelist** - Add `0.0.0.0/0` (all IPs) for Vercel deployment
3. **Clerk Redirects** - Update redirect URLs when deploying to production
4. **Prisma** - Run `npx prisma db push` after setting up database

---

## 📝 Status: Awaiting GitHub Connection

