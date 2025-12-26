# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running locally

### Setup

1. Install dependencies
```bash
npm install
```

2. Create environment file
```bash
cp .env.local.example .env.local
```

3. Update API URL in `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start development server
```bash
npm run dev
```

Visit `http://localhost:3000`

### Backend Requirements

The frontend requires a running backend API. Ensure your backend is configured with:
- CORS enabled for your frontend URL
- JWT authentication endpoints
- All required REST API endpoints

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
```bash
git push origin main
```

2. Import project to Vercel
- Go to https://vercel.com/new
- Select your GitHub repository
- Click Import

3. Set environment variables in Vercel dashboard
- `NEXT_PUBLIC_API_URL` - Your production API URL

4. Deploy
```bash
# Vercel automatically deploys on push
# No manual deployment needed
```

### Self-Hosted (Node.js)

1. Build the application
```bash
npm run build
```

2. Set environment variables
```bash
export NEXT_PUBLIC_API_URL=https://api.example.com
```

3. Start production server
```bash
npm start
```

The app will be available on port 3000

### Docker Deployment

1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next ./.next
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

2. Build and run
```bash
docker build -t delivery-app .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.example.com delivery-app
```

## Environment Variables

### Required
- `NEXT_PUBLIC_API_URL` - Backend API URL (must be public)

### Optional
- `NODE_ENV` - Set to 'production' for prod builds

## Production Checklist

- [ ] API URL configured for production
- [ ] Backend is deployed and accessible
- [ ] CORS is properly configured on backend
- [ ] SSL/TLS certificates are valid
- [ ] Error logging is configured
- [ ] Monitor API response times
- [ ] Test all authentication flows
- [ ] Verify role-based access works
- [ ] Test on mobile devices
- [ ] Set up monitoring/alerts

## Performance Optimization

### Already Configured
- Next.js 16 with Turbopack (faster builds)
- CSS variables for faster theme switching
- Optimized package imports
- Image optimization
- Code splitting by route

### Additional Steps
1. Enable CDN for static assets
2. Configure caching headers
3. Set up monitoring with Vercel Analytics
4. Enable compression on backend
5. Use database indexing for queries

## Troubleshooting

### Build Errors
```bash
# Clear build cache
rm -rf .next

# Rebuild
npm run build
```

### Runtime Errors
- Check browser console for errors
- Check Network tab for API failures
- Verify environment variables
- Check backend logs

### Performance Issues
- Monitor API response times
- Check backend database queries
- Enable compression
- Use CDN for static assets
- Consider caching strategies

## Monitoring

### Key Metrics to Monitor
- API response times
- Authentication failures
- User conversion rates
- Mobile performance (Core Web Vitals)
- Error rates by endpoint

### Tools
- Vercel Analytics (included)
- Sentry (optional error tracking)
- DataDog/New Relic (optional APM)
- Google Analytics (optional)
