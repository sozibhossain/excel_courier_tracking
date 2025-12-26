# Installation & Setup Guide

## System Requirements

- Node.js 18.0 or higher
- npm 9+ or yarn 3+
- Git (for cloning repository)
- Backend API (see Backend Setup)

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/delivery-management-app.git
cd delivery-management-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set the API URL:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Note**: The `NEXT_PUBLIC_` prefix makes this variable available in the browser.

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Access the Application

Open your browser and navigate to `http://localhost:3000`

## Backend Setup

The frontend requires a running backend API. Ensure:

1. **Backend is running** on the configured API URL
2. **CORS is enabled** for your frontend URL
3. **All API endpoints** are implemented (see Backend Documentation)

### Backend Services Needed

The backend should provide:

- Authentication endpoints (login, register, refresh token, logout)
- Admin APIs (metrics, parcels, users, reports)
- Agent APIs (parcels, location, tracking, route)
- Customer APIs (parcels, tracking)

## Testing the Installation

### Login with Demo Credentials

Use these test accounts:

```
Admin Account:
- Email: admin@demo.com
- Password: password123

Agent Account:
- Email: agent@demo.com
- Password: password123

Customer Account:
- Email: customer@demo.com
- Password: password123
```

### Verify Role-Based Access

1. Login with admin@demo.com
   - You should see the Admin Dashboard
   - Access `/admin/dashboard` to verify

2. Login with agent@demo.com
   - You should see the Agent Dashboard
   - Access `/agent/dashboard` to verify

3. Login with customer@demo.com
   - You should see the Customer Dashboard
   - Access `/customer/dashboard` to verify

## Build for Production

### Create Production Build

```bash
npm run build
```

### Run Production Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
delivery-management-app/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Home page (role-based redirect)
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── admin/                   # Admin routes (protected)
│   ├── agent/                   # Agent routes (protected)
│   └── customer/                # Customer routes (protected)
├── components/                   # Reusable React components
│   ├── admin/                   # Admin-specific components
│   ├── agent/                   # Agent-specific components
│   ├── customer/                # Customer-specific components
│   ├── ui/                      # shadcn/ui components
│   └── ...                      # Other shared components
├── lib/                         # Utilities and helpers
│   ├── api-client.ts           # API request functions
│   ├── auth-context.tsx        # Authentication state management
│   ├── hooks/                  # Custom React hooks
│   └── ...                     # Other utilities
├── public/                      # Static assets
├── app/globals.css             # Global styles & design tokens
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## Troubleshooting

### Issue: "Failed to fetch from API"

**Solution**:
1. Verify backend is running
2. Check `NEXT_PUBLIC_API_URL` is correct in `.env.local`
3. Ensure CORS is enabled on backend
4. Check Network tab in browser DevTools

### Issue: "Cannot find module '@/*'"

**Solution**:
- Clear cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Restart dev server

### Issue: "Styles not loading"

**Solution**:
1. Clear Next.js cache: `rm -rf .next`
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart dev server
4. Verify Tailwind CSS is properly configured

### Issue: "Auth token expired"

**Solution**:
- The app automatically refreshes tokens
- If still failing, clear localStorage and login again:
```javascript
localStorage.clear()
location.reload()
```

### Issue: "Access Denied" error when accessing admin/agent/customer pages

**Solution**:
1. Verify you're logged in with the correct role
2. Check browser console for error messages
3. Verify backend returns correct user role
4. Try logging out and in again

## Development Commands

```bash
# Start development server
npm run dev

# Create production build
npm run build

# Start production server
npm start

# Run TypeScript type checking
npm run type-check

# Run linter
npm run lint
```

## Getting Help

- Check the README.md for project overview
- See DEPLOYMENT.md for deployment instructions
- Review API documentation in backend repository
- Check browser DevTools Console for errors
- Verify backend API is responding correctly

## Next Steps

1. **Customize branding** - Update logo and colors
2. **Configure backend** - Set up your API endpoints
3. **Test flows** - Verify all user journeys work
4. **Deploy** - Follow DEPLOYMENT.md guide
5. **Monitor** - Set up error tracking and analytics
