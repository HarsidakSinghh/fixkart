# FixKart Admin Dashboard

A comprehensive admin dashboard for the FixKart e-commerce platform built with Next.js 16, TypeScript, and MongoDB.

## 🚀 Quick Deployment to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Click the button above and connect your GitHub repository. You'll need to configure environment variables in the Vercel dashboard.

### Manual Deployment

1. Push this repository to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your `fixkart` repository
5. Add environment variables (see below)
6. Click "Deploy"

## 📋 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MongoDB connection string | ✅ Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | ✅ Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | ✅ Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ Yes |
| `EMAIL_HOST` | SMTP host | Optional |
| `EMAIL_PORT` | SMTP port | Optional |
| `EMAIL_USER` | SMTP username | Optional |
| `EMAIL_PASSWORD` | SMTP password | Optional |

## 🛠️ Local Development

### Prerequisites

- Node.js 22+
- MongoDB (local or Atlas)
- Clerk account
- Cloudinary account

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard routes
│   ├── api/               # API routes
│   └── sign-in/           # Clerk authentication
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   └── ui/               # UI primitives
├── lib/                   # Utilities & configurations
│   ├── services/         # Business logic & PDF generators
│   ├── admin-guard.ts    # Admin route protection
│   ├── cloudinary.ts     # Cloudinary configuration
│   └── prisma.ts         # Database client
├── prisma/               # Database schema
├── public/               # Static assets
└── mobileapp/            # React Native mobile app
```

## 🔐 Authentication

This project uses [Clerk](https://clerk.com) for authentication. Configure your Clerk application:

1. Create a Clerk account
2. Create a new application
3. Copy API keys to `.env.local`
4. Configure redirect URLs in Clerk dashboard:
   - `http://localhost:3000` (development)
   - `https://your-domain.vercel.app` (production)

## 🗄️ Database Schema

The project uses Prisma ORM with MongoDB. Key models include:

- **Product** - Product catalog management
- **VendorProfile** - Vendor registration & KYC
- **CustomerProfile** - Customer registration & KYC
- **Order** - Order management
- **OrderItem** - Individual order items
- **RefundRequest** - Returns & complaints

Run migrations:

```bash
npx prisma db push
```

## ☁️ Cloudinary Setup

1. Create a Cloudinary account
2. Add an upload preset for unsigned uploads
3. Configure the following settings in Cloudinary dashboard:
   - Upload presets
   - Allowed formats
   - Maximum file size

## 📧 Email Notifications

Configure SMTP settings for transactional emails. The system supports nodemailer for:

- Order confirmations
- Status updates
- Vendor approval notifications

## 📱 Mobile App

The `mobileapp/` directory contains a React Native mobile app for vendors. See `mobileapp/README.md` for setup instructions.

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma database UI
```

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

