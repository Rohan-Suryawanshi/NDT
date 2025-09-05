# NDT Connect Deployment Guide

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Database Setup](#database-setup)
5. [Third-Party Services](#third-party-services)
6. [Security Considerations](#security-considerations)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0 or higher (local or Atlas)
- **Git**: Latest version

### System Requirements
**Minimum:**
- RAM: 2GB
- Storage: 5GB free space
- CPU: 2 cores

**Recommended:**
- RAM: 4GB or higher
- Storage: 20GB free space
- CPU: 4 cores or higher

---

## Local Development

### 1. Clone Repository
```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/NDTConnect2

# CORS
CORS_ORIGIN=http://localhost:3000

# JWT Secrets
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here
REFRESH_TOKEN_EXPIRY=7d

# Email Verification
EMAIL_VERIFICATION_SECRET=your_email_verification_secret

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service (Microsoft Graph)
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_app_password
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
MS_EMAIL=your_microsoft_email@outlook.com

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google AI
GOOGLE_API_KEY=your_google_gemini_api_key
```

### 4. Start Development Server
```bash
# Start with nodemon (auto-restart)
npm run dev

# Or start normally
npm start
```

The server will start on `http://localhost:8000`

### 5. Verify Installation
Test the API:
```bash
curl http://localhost:8000/api/v1/service/all
```

---

## Production Deployment

### Vercel Deployment (Recommended)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Configure vercel.json
Ensure your `vercel.json` is properly configured:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "./index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 3. Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### 4. Configure Environment Variables
In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required environment variables
4. Redeploy the application

### Alternative Deployment Options

#### AWS EC2 Deployment
1. **Launch EC2 Instance**
   - Ubuntu 20.04 LTS
   - t3.micro (minimum)
   - Configure security groups (ports 80, 443, 22)

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx
   ```

3. **Deploy Application**
   ```bash
   git clone <repository-url>
   cd backend
   npm install --production
   ```

4. **Configure PM2**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "ndt-backend"
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### Docker Deployment
1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   EXPOSE 8000
   
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t ndt-backend .
   docker run -p 8000:8000 --env-file .env ndt-backend
   ```

---

## Database Setup

### MongoDB Atlas (Recommended for Production)

#### 1. Create Cluster
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Choose your preferred region
4. Select M0 (free tier) or appropriate paid tier

#### 2. Configure Network Access
1. Go to "Network Access"
2. Add IP address `0.0.0.0/0` for Vercel (or specific IPs)
3. Save changes

#### 3. Create Database User
1. Go to "Database Access"
2. Add new database user
3. Set username and password
4. Assign appropriate permissions

#### 4. Get Connection String
1. Go to "Clusters"
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password

### Local MongoDB Setup

#### Installation (Ubuntu/Debian)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Installation (macOS)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Installation (Windows)
1. Download MongoDB installer from [official website](https://www.mongodb.com/try/download/community)
2. Run installer with default settings
3. Start MongoDB service

---

## Third-Party Services

### Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret
3. Configure upload presets if needed
4. Set transformation options for optimized delivery

### Stripe Setup
1. Create account at [Stripe](https://stripe.com/)
2. Get your test and live API keys
3. Configure webhooks:
   - Endpoint: `https://your-domain.com/api/v1/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Save webhook secret

### Microsoft Graph (Email)
1. Register app in [Azure Portal](https://portal.azure.com/)
2. Configure API permissions:
   - `Mail.Send`
   - `User.Read`
3. Generate client secret
4. Get tenant ID and client ID

### Google Gemini AI
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create new project
3. Generate API key
4. Enable Gemini API

---

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique secrets for JWT tokens
- Rotate secrets regularly
- Use different keys for different environments

### API Security
- Enable CORS for specific origins only
- Implement rate limiting
- Validate all input data
- Use HTTPS in production
- Keep dependencies updated

### File Uploads
- Validate file types and sizes
- Scan uploaded files for malware
- Use secure cloud storage
- Implement access controls

### Database Security
- Use strong database passwords
- Enable authentication
- Restrict network access
- Regular backups
- Monitor for suspicious activity

---

## Monitoring & Logging

### Error Tracking
Integrate with error tracking services:

#### Sentry Integration
```bash
npm install @sentry/node
```

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring
- Monitor API response times
- Track database query performance
- Monitor memory and CPU usage
- Set up alerts for high error rates

### Logging Strategy
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Checks
Implement health check endpoint:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
Error: MongoNetworkError: failed to connect to server
```

**Solutions:**
- Verify MongoDB is running
- Check connection string format
- Verify network access (Atlas)
- Check firewall settings

#### 2. Cloudinary Upload Failed
```bash
Error: Invalid cloud_name
```

**Solutions:**
- Verify Cloudinary credentials
- Check API key permissions
- Ensure proper file format
- Check file size limits

#### 3. Stripe Payment Failed
```bash
Error: No such payment_intent
```

**Solutions:**
- Verify Stripe API keys
- Check webhook configuration
- Validate payment intent ID
- Review Stripe dashboard logs

#### 4. Email Sending Failed
```bash
Error: Authentication failed
```

**Solutions:**
- Verify Microsoft Graph credentials
- Check Azure app permissions
- Ensure correct tenant ID
- Review app registration settings

#### 5. JWT Token Issues
```bash
Error: Invalid access token
```

**Solutions:**
- Verify token secret matches
- Check token expiration
- Ensure proper token format
- Review middleware configuration

### Performance Issues

#### High Memory Usage
1. Monitor memory leaks
2. Optimize database queries
3. Implement proper caching
4. Use compression middleware

#### Slow API Response
1. Add database indexing
2. Optimize image processing
3. Implement API caching
4. Use CDN for static files

### Debugging Tools

#### Development
```bash
# Enable debug logs
DEBUG=* npm run dev

# Check logs
npm run logs

# Database queries
DEBUG=mongoose:* npm run dev
```

#### Production
```bash
# Check application logs
vercel logs

# Monitor real-time logs
vercel logs --follow
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database connections tested
- [ ] Third-party services configured
- [ ] SSL certificates installed
- [ ] Security headers configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Backup strategy in place

### Post-Deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Database connectivity verified
- [ ] File uploads working
- [ ] Email notifications sending
- [ ] Payment processing functional
- [ ] Monitoring alerts configured
- [ ] Performance metrics baseline established

---

## Backup & Recovery

### Database Backup
#### MongoDB Atlas
- Automated backups included
- Configure backup schedule
- Test restore procedures

#### Self-Hosted MongoDB
```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/NDTConnect2" --out=/backup/

# Restore backup
mongorestore --uri="mongodb://localhost:27017/NDTConnect2" /backup/NDTConnect2/
```

### File Storage Backup
- Cloudinary provides automatic backups
- Implement additional backup strategy for critical files
- Regular backup verification

### Application Code
- Git repository serves as version control
- Tag releases for easy rollback
- Maintain deployment documentation

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancers
- Implement stateless design
- Session management strategy
- Database sharding if needed

### Vertical Scaling
- Monitor resource usage
- Upgrade server specifications
- Optimize database performance
- Implement caching strategies

### CDN Integration
- Static file delivery
- Image optimization
- Global distribution
- Cache invalidation strategy

---

For additional support or questions about deployment, please refer to the [main documentation](./backend_documentation.md) or contact the development team.
