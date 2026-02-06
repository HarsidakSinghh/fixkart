# FixKart Admin Mobile App

A React Native mobile application for managing FixKart admin operations with Clerk authentication and real-time database connectivity.

## 🚀 Features

- **Clerk Authentication**: Secure login using Clerk identity platform
- **Admin Authorization**: Restricted access to authorized admin emails only
- **Real Database**: Direct connectivity to your PostgreSQL database via Prisma
- **Dashboard**: Live KPI overview with revenue, orders, and vendor statistics
- **Order Management**: View and update order statuses
- **Vendor Management**: Approve/reject vendor applications
- **Customer Management**: Manage customer approvals
- **Inventory Control**: Monitor inventory and product approvals
- **Complaints & Refunds**: Handle customer issues and refund requests

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Clerk account (for authentication)
- Running backend server (Next.js app)

## 🛠️ Installation

### 1. Clone and Setup

```bash
# Navigate to mobile app directory
cd mobileapp

# Install dependencies
npm install

# Install Expo CLI if not already installed
npm install -g expo-cli
```

### 2. Environment Configuration

Create a `.env.local` file in the `mobileapp` directory with the following variables:

```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# API Configuration  
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# Development mode
EXPO_PUBLIC_ENVIRONMENT=development
```

**Important**: Replace the Clerk keys with your actual Clerk credentials from your Clerk dashboard.

### 3. Backend Setup

Ensure your main Next.js app is running:

```bash
# From the main project directory
npm run dev

# The mobile app will connect to http://localhost:3000
```

## 🔐 Admin Access

Only authorized admin emails can access the mobile app:

- `jka8685@gmail.com`
- `info@thefixkart.com`

To add more admin emails, update:
1. `mobileapp/src/context/AuthContext.js` - `ADMIN_EMAILS` array
2. `app/api/mobile/auth/verify-admin/route.js` - `ADMIN_EMAILS` array

## 📱 Running the App

### Start Metro Bundler

```bash
cd mobileapp
expo start
```

### Run on Platforms

```bash
# iOS Simulator
expo start --ios

# Android Emulator  
expo start --android

# Web Browser
expo start --web
```

## 📁 Project Structure

```
mobileapp/
├── App.js                          # Main app with auth flow
├── .env.local                       # Environment variables
├── src/
│   ├── context/
│   │   └── AuthContext.js          # Authentication state management
│   ├── services/
│   │   ├── api.js                  # API calls with auth headers
│   │   ├── auth.js                 # Auth token management
│   │   ├── database.js             # Direct database operations
│   │   └── useAsyncList.js        # Async data fetching hook
│   ├── screens/
│   │   ├── LoginScreen.js          # Clerk login screen
│   │   ├── DashboardScreen.js      # Admin dashboard
│   │   ├── OrdersScreen.js         # Order management
│   │   └── ...                     # Other screens
│   ├── components/
│   │   ├── BottomNav.js            # Navigation bar
│   │   ├── UserHeader.js           # User info with logout
│   │   └── ...                     # UI components
│   └── theme.js                    # App theme and colors
└── ...
```

## 🔄 Authentication Flow

1. **Login Screen**: User enters email/password
2. **Clerk Verification**: Clerk validates credentials
3. **Admin Check**: Backend verifies admin email
4. **Token Storage**: Session token saved securely
5. **Dashboard Access**: User redirected to dashboard
6. **API Requests**: All requests include auth token

## 📡 API Endpoints

All mobile API endpoints require authentication:

### Authentication
- `POST /api/mobile/auth/verify-admin` - Verify admin status

### Dashboard
- `GET /api/mobile/dashboard` - Get dashboard data

### Orders
- `GET /api/mobile/orders` - List orders
- `PATCH /api/mobile/orders/:id` - Update order status

### Vendors
- `GET /api/mobile/vendors` - List vendors
- `PATCH /api/mobile/vendors/:id` - Update vendor status

### Customers
- `GET /api/mobile/customers` - List customers
- `PATCH /api/mobile/customers/:id` - Update customer status

### Products
- `GET /api/mobile/products` - List products
- `PATCH /api/mobile/products/:id` - Approve/reject product

### Inventory
- `GET /api/mobile/inventory` - List inventory
- `GET /api/mobile/inventory-approvals` - Pending approvals

### Users
- `GET /api/mobile/users` - List users
- `PATCH /api/mobile/users/:id` - Ban/unban user

### Complaints & Refunds
- `GET /api/mobile/complaints` - List complaints
- `PATCH /api/mobile/complaints/:id` - Update complaint
- `GET /api/mobile/refunds` - List refunds
- `PATCH /api/mobile/refunds/:id` - Update refund

## 🔧 Configuration

### Clerk Setup

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the Publishable Key to `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
4. Copy the Secret Key to `CLERK_SECRET_KEY`
5. Configure email/password authentication in Clerk dashboard

### Database Connection

The app connects to your existing PostgreSQL database via the Next.js backend:

```javascript
// Database configuration in prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 🐛 Troubleshooting

### Login Issues

**"No authentication token available"**
- Ensure Clerk keys are correct in `.env.local`
- Check that the backend is running
- Verify network connectivity

**"Access Denied"**
- Check if your email is in the admin list
- Verify email matches exactly (case-sensitive)

### API Errors

**"Failed to fetch dashboard data"**
- Ensure backend server is running
- Check API base URL in `.env.local`
- Verify database connection

### Installation Issues

**npm install errors**
```bash
# Try with legacy peer dependencies
npm install --legacy-peer-deps
```

**Expo start issues**
```bash
# Clear cache and restart
expo start -c
```

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Login | Clerk authentication |
| Dashboard | KPIs, revenue charts, alerts |
| Orders | Live order pipeline |
| Orders History | Archived orders |
| Users | Admin user management |
| Products | Product catalog |
| Inventory | Warehouse stock |
| Inventory Approvals | Pending product listings |
| Vendors | Vendor management |
| Onboarded Vendors | Approved vendors |
| Customer Approvals | Pending customers |
| Onboarded Customers | Verified customers |
| Complaints | Customer escalations |
| Refunds | Finance desk |

## 🔐 Security

- JWT tokens stored securely using `expo-secure-store`
- Admin email verification on every login
- Protected API routes with Clerk authentication
- No sensitive data in code or mock files

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review backend logs
3. Contact the development team

## 🚀 Quick Start

```bash
# 1. Setup environment
cd mobileapp
cp .env.example .env.local
# Edit .env.local with your Clerk keys

# 2. Install dependencies
npm install

# 3. Start backend (from main directory)
cd ..
npm run dev

# 4. Start mobile app (new terminal)
cd mobileapp
expo start
```

---

Built with ❤️ for FixKart Administration

