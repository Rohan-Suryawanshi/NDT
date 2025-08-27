# Deployment Guide

This guide covers deploying the NDT Connect frontend application to various platforms.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Build Process](#build-process)
- [Deployment Platforms](#deployment-platforms)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Tools
- Node.js 18+ and npm 9+
- Git
- Access to deployment platform
- Environment configuration

### Pre-deployment Checklist
- [ ] All tests pass (`npm run lint`, `npm run build`)
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Browser compatibility tested
- [ ] Performance optimized
- [ ] Security review completed

## 🔐 Environment Variables

### Required Variables

Create a `.env.production` file:

```env
# API Configuration
VITE_API_URL=https://api.ndtconnect.com
VITE_API_VERSION=v1

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here

# Application Configuration
VITE_APP_NAME="NDT Connect"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false

# External Services
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### Environment-Specific Configurations

#### Development
```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
VITE_ENABLE_DEBUG=true
```

#### Staging
```env
VITE_API_URL=https://staging-api.ndtconnect.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
VITE_ENABLE_DEBUG=true
```

#### Production
```env
VITE_API_URL=https://api.ndtconnect.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
VITE_ENABLE_DEBUG=false
```

## 🏗️ Build Process

### Production Build

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Build for production
npm run build

# Test the build locally
npm run preview
```

### Build Optimization

The build process automatically:
- Minifies and compresses assets
- Optimizes images
- Tree-shakes unused code
- Generates source maps
- Creates compressed files (gzip/brotli)

### Build Output

```
dist/
├── assets/
│   ├── index.[hash].js
│   ├── index.[hash].css
│   └── [other-assets]
├── index.html
└── vite.svg
```

## 🚀 Deployment Platforms

### Vercel (Recommended)

#### Automatic Deployment

1. **Connect Repository**
   - Import project to Vercel
   - Connect GitHub repository
   - Configure build settings

2. **Configure Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm ci"
   }
   ```

3. **Environment Variables**
   - Add all production environment variables
   - Enable automatic deployments

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

#### Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Netlify

#### Automatic Deployment

1. **Connect Repository**
   - Import from Git
   - Configure build settings

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Redirect Rules**

Create `_redirects` in `public/`:

```
/*    /index.html   200
```

#### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### AWS S3 + CloudFront

#### S3 Deployment

```bash
# Build the project
npm run build

# Install AWS CLI
# Configure AWS credentials

# Sync to S3 bucket
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### CloudFront Configuration

```json
{
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": [
    {
      "ErrorCode": 403,
      "ResponseCode": 200,
      "ResponsePagePath": "/index.html"
    },
    {
      "ErrorCode": 404,
      "ResponseCode": 200,
      "ResponsePagePath": "/index.html"
    }
  ]
}
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_types
            text/plain
            text/css
            text/js
            text/xml
            text/javascript
            application/javascript
            application/xml+rss;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location /assets {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

#### Docker Commands

```bash
# Build image
docker build -t ndt-connect-frontend .

# Run container
docker run -p 80:80 ndt-connect-frontend

# Docker Compose
docker-compose up -d
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Build project
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build project
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:$NODE_VERSION
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run lint
    - npm run build
  only:
    - merge_requests
    - main

build:
  stage: build
  image: node:$NODE_VERSION
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  only:
    - main

deploy:
  stage: deploy
  script:
    - echo "Deploying to production..."
    # Add your deployment script here
  only:
    - main
  when: manual
```

## 📊 Monitoring

### Performance Monitoring

1. **Web Vitals**
   - Core Web Vitals tracking
   - Performance metrics
   - User experience monitoring

2. **Error Tracking**
   - Sentry integration
   - Error reporting
   - Performance issues

3. **Analytics**
   - Google Analytics
   - User behavior tracking
   - Conversion tracking

### Health Checks

```javascript
// Add to your app
const healthCheck = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  version: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.VITE_APP_ENVIRONMENT,
};

// Expose health endpoint
window.healthCheck = healthCheck;
```

## 🔧 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+

# Check for TypeScript errors
npm run type-check
```

#### Environment Variable Issues

```bash
# Verify environment variables are loaded
console.log(import.meta.env);

# Check for typos in variable names
# Ensure variables start with VITE_
```

#### Routing Issues

- Ensure server redirects all routes to `index.html`
- Check for case sensitivity in route paths
- Verify base URL configuration

#### Performance Issues

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for large dependencies
npm run analyze-bundle

# Optimize images and assets
```

### Debug Mode

Enable debug mode in development:

```javascript
if (import.meta.env.VITE_ENABLE_DEBUG) {
  // Enable debug logging
  console.log('Debug mode enabled');
  window.DEBUG = true;
}
```

### Rollback Strategy

1. **Vercel**: Revert to previous deployment
2. **Netlify**: Deploy previous branch
3. **Docker**: Switch to previous image tag
4. **Manual**: Deploy previous build artifacts

---

For specific deployment issues, consult the platform documentation or reach out to the development team.
