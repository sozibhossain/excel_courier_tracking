# Delivery Management System

A professional, role-based web application for managing delivery logistics with separate interfaces for Admins, Agents, and Customers. Built with Next.js 16, TypeScript, and modern design principles.

## Features

### Admin Dashboard
- **Metrics Overview** - Total parcels, active users, in-transit packages, average delivery times
- **Parcel Management** - View, search, and manage all parcels in the system
- **User Management** - Manage admins, agents, and customers
- **Reports** - Generate and download CSV/PDF reports for bookings and performance
- **Responsive Design** - Collapsible sidebar for all screen sizes

### Agent App (Mobile-First)
- **Parcel Dashboard** - View assigned parcels with status filtering (pending/completed)
- **Quick Actions** - Mark deliveries as complete or report issues
- **Route Map** - View optimized delivery routes
- **Performance Stats** - Track daily deliveries, average times, and customer ratings
- **Profile Management** - View and edit agent information
- **Bottom Navigation** - Mobile-friendly navigation bar

### Customer App
- **Shipment Dashboard** - Browse all shipments with status indicators
- **Real-Time Tracking** - Detailed tracking timeline with location and status updates
- **Status Updates** - See estimated delivery dates and current location
- **Responsive** - Works seamlessly on mobile, tablet, and desktop

## Architecture

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (ADMIN, AGENT, CUSTOMER)
- Automatic role-based redirects
- Client-side auth state management with React Context
- Protected routes with middleware

### Design System
- **Color Palette**: Professional deep blue primary with teal accents
- **Typography**: Consistent font sizing and weights using Tailwind CSS
- **Spacing**: Semantic spacing scale for consistent layouts
- **Responsive**: Mobile-first approach with responsive breakpoints
- **Components**: shadcn/ui components with custom styling

### API Integration
- Centralized API client with authentication
- Custom hooks for data fetching (useAdminMetrics, useAgentParcels, etc.)
- Automatic token refresh on 401 responses
- Error handling and loading states
- Type-safe API responses

## Project Structure

```
app/
├── (root pages)
│   ├── page.tsx                 # Role-based redirect
│   ├── login/page.tsx           # Login form
│   └── register/page.tsx        # Registration form
├── admin/
│   ├── layout.tsx              # Admin auth wrapper
│   ├── dashboard/page.tsx       # Metrics & overview
│   ├── parcels/page.tsx         # Parcel management
│   ├── users/page.tsx           # User management
│   └── reports/page.tsx         # Reports & exports
├── agent/
│   ├── layout.tsx              # Agent auth wrapper
│   ├── dashboard/page.tsx       # Parcel list & actions
│   ├── map/page.tsx            # Route mapping
│   ├── stats/page.tsx          # Performance stats
│   └── profile/page.tsx        # Agent profile
└── customer/
    ├── layout.tsx              # Customer auth wrapper
    ├── dashboard/page.tsx       # Shipment list
    └── tracking/[trackingId]/page.tsx  # Tracking details

components/
├── admin/
│   ├── sidebar.tsx             # Admin navigation
│   ├── metrics-grid.tsx        # KPI cards
│   └── parcels-table.tsx       # Parcel listings
├── agent/
│   ├── bottom-nav.tsx          # Mobile navigation
│   └── parcel-card.tsx         # Parcel card component
├── customer/
│   ├── tracking-timeline.tsx   # Status timeline
│   └── shipment-status.tsx     # Status overview
├── auth-page-layout.tsx        # Auth page wrapper
└── role-based-redirect.tsx     # Router logic

lib/
├── api-client.ts               # API request utilities
├── auth-context.tsx            # Auth state management
├── env.ts                       # Environment config
└── hooks/
    ├── use-admin-metrics.ts    # Admin metrics hook
    ├── use-admin-parcels.ts    # Admin parcels hook
    ├── use-agent-parcels.ts    # Agent parcels hook
    ├── use-customer-parcels.ts # Customer parcels hook
    └── use-parcel-tracking.ts  # Tracking data hook
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running (see Backend Setup)

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd delivery-management-app
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Backend Setup

The backend API must be running for the app to function. Ensure your backend is accessible at the `NEXT_PUBLIC_API_URL` you configured.

**API Endpoints Used:**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Current user info
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `GET /admin/metrics/dashboard` - Admin metrics
- `GET /admin/parcels` - List all parcels (admin)
- `GET /admin/users` - List all users
- `GET /agent/parcels` - List agent's parcels
- `GET /customer/parcels` - List customer's parcels
- `GET /parcels/{id}/track` - Get tracking details
- And more (see backend Postman collection)

## Authentication

### Demo Credentials

Use these credentials to test different roles:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Agent | agent@demo.com | password123 |
| Customer | customer@demo.com | password123 |

### How Auth Works

1. User logs in with email/password
2. Backend returns `accessToken` and `refreshToken`
3. Tokens stored in localStorage
4. `accessToken` sent with each API request
5. On 401 response, `refreshToken` used to get new token
6. User redirected to appropriate dashboard based on role

## Styling & Theming

### Design Tokens
All colors defined in `app/globals.css` as CSS variables:
- `--primary` - Deep blue for main actions
- `--secondary` - Teal for agent/secondary actions
- `--success` - Green for positive states
- `--destructive` - Red for errors/warnings
- `--muted` - Gray for secondary text

### Responsive Breakpoints
- `sm` - 640px (mobile)
- `md` - 768px (tablet)
- `lg` - 1024px (desktop)
- `xl` - 1280px (wide)

### Tailwind Configuration
Uses Tailwind CSS v4 with semantic color system. All component styling follows the design token structure.

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_API_URL` - Your production API URL
4. Deploy

The application will automatically build and deploy with each push.

### Build for Production

```bash
npm run build
npm start
```

## Features & Capabilities

### Role-Based Access Control
- Admin users access admin dashboard only
- Agents access agent app only
- Customers access customer app only
- Automatic redirects prevent unauthorized access

### Real-Time Tracking
- Live parcel status updates
- Timeline view with location history
- Estimated delivery dates
- Agent assignment info

### Performance Monitoring
- Agent delivery statistics
- Customer satisfaction ratings
- Time-based metrics
- Trend analysis

### Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts for all screens
- Bottom nav for mobile agents
- Sidebar for admin desktop

## API Client Usage

### Making Authenticated Requests

```typescript
import { authenticatedFetch } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const { tokens } = useAuth()
  
  const fetchData = async () => {
    const response = await authenticatedFetch(
      '/admin/parcels',
      tokens?.accessToken
    )
    const data = await response.json()
  }
}
```

### Using Data Hooks

```typescript
import { useAdminParcels } from '@/lib/hooks/use-admin-parcels'

function AdminParcels() {
  const { parcels, loading, error } = useAdminParcels()
  
  if (loading) return <Spinner />
  if (error) return <Error message={error} />
  
  return <ParcelsList parcels={parcels} />
}
```

## Troubleshooting

### Login Issues
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure credentials match backend data
- Check browser console for error messages

### API Errors
- Verify backend API is accessible
- Check network tab in DevTools
- Ensure tokens are being sent with requests
- Verify JWT tokens haven't expired

### Styling Issues
- Clear Next.js cache: `rm -rf .next`
- Restart dev server
- Check Tailwind CSS is properly configured
- Verify design tokens in `globals.css`

## Technologies Used

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with CSS Variables
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API
- **HTTP Client**: Native Fetch API
- **Authentication**: JWT with localStorage

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When making changes:
1. Follow the existing code structure
2. Use TypeScript for type safety
3. Keep components small and focused
4. Use semantic HTML and ARIA attributes
5. Test on mobile devices
6. Maintain responsive design

## License

This project is proprietary. All rights reserved.
