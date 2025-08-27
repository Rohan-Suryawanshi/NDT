# NDT Connect Backend Documentation

## 📋 Overview
NDT Connect is a comprehensive backend service for a Non-Destructive Testing (NDT) service marketplace platform that connects clients requiring NDT services with certified service providers and qualified inspectors. The platform facilitates the entire workflow from job posting to completion, including quotations, payments, and quality assurance.

## 🎯 Mission
To streamline the NDT industry by providing a digital platform that:
- Connects qualified NDT service providers with clients
- Ensures quality through certification tracking
- Facilitates secure payments and project management
- Leverages AI for procedure generation and optimization

## 🚀 Core Features

### User Management & Authentication
- **Multi-role System**: Clients, Service Providers, and Inspectors
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Email Verification**: Mandatory email verification for account activation
- **Role-based Access Control**: Granular permissions based on user roles
- **Profile Management**: Comprehensive profile systems for each user type

### Service Provider Ecosystem
- **Company Profiles**: Detailed service provider information and capabilities
- **Service Offerings**: Catalog of available NDT services with pricing
- **Certification Management**: Upload and track company certifications
- **Equipment Registry**: Maintain equipment inventory with calibration tracking
- **Skill Matrix**: Track technician qualifications and certifications

### Job Request Management
- **Job Creation**: Clients can post detailed job requirements
- **Quotation System**: Providers can submit competitive quotes
- **Status Tracking**: Real-time job status updates throughout lifecycle
- **Communication**: Built-in messaging system for negotiations
- **File Attachments**: Support for technical drawings and specifications

### Payment Processing
- **Stripe Integration**: Secure payment processing with industry standards
- **Escrow System**: Hold payments until job completion
- **Fee Management**: Automatic platform fee calculation and collection
- **Withdrawal System**: Automated payouts to service providers
- **Transaction History**: Comprehensive payment tracking and reporting

### AI-Powered Features
- **Procedure Generation**: AI-generated NDT procedures using Google Gemini


### Compliance & Quality
- **Certification Tracking**: Monitor expiration dates and renewal requirements
- **Automated Alerts**: Email notifications for expiring certifications
- **Equipment Calibration**: Track calibration schedules and compliance
- **Quality Ratings**: Client feedback and provider rating system

## 🛠️ Tech Stack

### Backend Technologies
- **Runtime**: Node.js v18+ with ES6 modules
- **Framework**: Express.js with middleware architecture
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs
- **File Storage**: Cloudinary for secure file management
- **Payment Processing**: Stripe API integration
- **Email Service**: Microsoft Graph API with Nodemailer
- **AI Integration**: Google Gemini API for procedure generation
- **Scheduling**: Node-cron for automated tasks
- **Security**: CORS, Helmet, rate limiting

### Development Tools
- **Package Manager**: npm
- **Development Server**: Nodemon with hot reload
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git with conventional commits
- **Deployment**: Vercel (serverless functions)

### Third-Party Services
- **Database Hosting**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Payment Gateway**: Stripe
- **Email Service**: Microsoft Outlook/Exchange
- **AI Services**: Google AI Studio (Gemini)
- **Deployment Platform**: Vercel

## 📁 Project Structure

The backend follows a modular MVC (Model-View-Controller) architecture with clear separation of concerns:

```
backend/
├── 📄 index.js                    # Application entry point
├── 📄 package.json               # Dependencies and scripts
├── 📄 vercel.json                # Vercel deployment configuration
├── 📄 .env                       # Environment variables (not in repo)
├── 📁 public/                    # Static files and temporary uploads
│   └── 📁 temp/                  # Temporary file storage
└── 📁 src/                       # Source code directory
    ├── 📄 app.js                 # Express application setup and middleware
    ├── 📄 index.js               # Server initialization and database connection
    ├── 📄 constants.js           # Application-wide constants
    │
    ├── 📁 controllers/           # Request handlers and business logic
    │   ├── 📄 User.controller.js              # User authentication and management
    │   ├── 📄 ClientProfile.controller.js     # Client profile operations
    │   ├── 📄 ServiceProvider.controller.js   # Provider profile management
    │   ├── 📄 Inspector.controller.js         # Inspector profile operations
    │   ├── 📄 JobRequest.controller.js        # Job posting and management
    │   ├── 📄 Payment.controller.js           # Payment processing
    │   ├── 📄 Equipment.controller.js         # Equipment management
    │   ├── 📄 CompanyCertification.controller.js # Certification handling
    │   ├── 📄 Service.controller.js           # Service catalog management
    │   ├── 📄 ServiceOffered.controller.js    # Provider service offerings
    │   ├── 📄 SkillMatrix.controller.js       # Technician qualifications
    │   ├── 📄 Gemini.controller.js           # AI procedure generation
    │   ├── 📄 AdminSettings.controller.js     # Admin panel operations
    │   └── 📄 ContactUs.controller.js         # Contact form handling
    │
    ├── 📁 models/                # Database schemas and models
    │   ├── 📄 User.model.js                   # User account schema
    │   ├── 📄 ClientProfile.model.js          # Client company information
    │   ├── 📄 ServiceProviderProfile.model.js # Provider company details
    │   ├── 📄 InspectorProfile.model.js       # Inspector credentials
    │   ├── 📄 JobRequest.model.js             # Job requirements and status
    │   ├── 📄 Payment.model.js                # Payment transactions
    │   ├── 📄 Equipment.model.js              # Equipment registry
    │   ├── 📄 CompanyCertification.model.js   # Company certifications
    │   ├── 📄 Service.model.js                # Available NDT services
    │   ├── 📄 ServiceOffered.model.js         # Provider-specific offerings
    │   ├── 📄 SkillMatrix.model.js            # Technician qualifications
    │   ├── 📄 ProviderBalance.model.js        # Provider financial balance
    │   ├── 📄 Withdrawal.model.js             # Withdrawal requests
    │   └── 📄 AdminSettings.model.js          # Platform configuration
    │
    ├── 📁 routes/                # API endpoint definitions
    │   ├── 📄 user.routes.js                  # User authentication routes
    │   ├── 📄 clientProfile.routes.js         # Client profile endpoints
    │   ├── 📄 serviceProvider.routes.js       # Provider profile endpoints
    │   ├── 📄 inspector.routes.js             # Inspector profile endpoints
    │   ├── 📄 jobRequest.routes.js            # Job management endpoints
    │   ├── 📄 payment.routes.js               # Payment processing endpoints
    │   ├── 📄 equipment.routes.js             # Equipment management endpoints
    │   ├── 📄 companyCertification.routes.js  # Certification endpoints
    │   ├── 📄 service.routes.js               # Service catalog endpoints
    │   ├── 📄 serviceOffered.routes.js        # Service offering endpoints
    │   ├── 📄 skillMatrix.routes.js           # Skill matrix endpoints
    │   ├── 📄 gemini.routes.js               # AI procedure endpoints
    │   ├── 📄 adminSettings.routes.js         # Admin panel endpoints
    │   └── 📄 contact.routes.js               # Contact form endpoints
    │
    ├── 📁 middlewares/           # Custom middleware functions
    │   ├── 📄 auth.middleware.js              # JWT token verification
    │   ├── 📄 isAdmin.js                      # Admin role verification
    │   └── 📄 multer.middleware.js            # File upload handling
    │
    ├── 📁 utils/                 # Utility functions and helpers
    │   ├── 📄 ApiError.js                     # Custom error class
    │   ├── 📄 ApiResponse.js                  # Standardized response format
    │   ├── 📄 AsyncHandler.js                 # Async error wrapper
    │   ├── 📄 Cloudinary.js                   # File upload to Cloudinary
    │   └── 📄 SendMail.js                     # Email service integration
    │
    ├── 📁 cronJobs/              # Scheduled background tasks
    │   ├── 📄 certificateExpiryAlert.js       # Certificate expiry notifications
    │   └── 📄 skillMatrixExpiryAlert.js       # Skill matrix expiry alerts
    │
    └── 📁 db/                    # Database configuration
        └── 📄 index.js                        # MongoDB connection setup
```

### Architecture Principles

#### MVC Pattern Implementation
- **Models**: Define data structure, validation rules, and business logic
- **Views**: JSON API responses (no traditional view templates)
- **Controllers**: Handle HTTP requests, process business logic, and return responses

#### Middleware Architecture
```javascript
Request → CORS → Body Parser → Authentication → Authorization → Route Handler → Response
```

#### Error Handling Flow
```javascript
Controller → AsyncHandler → Global Error Handler → Formatted Response
```

## API Endpoints Documentation

### 1. Authentication & User Management
#### POST /api/user/register
- **Description:** Register new user
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "client|provider|inspector",
    "acceptedTerms": true,
    "location": "string",
    "currency": "string",
    "avatar": "file"
  }
  ```

#### POST /api/user/login
- **Description:** User login
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

### 2. Client Profile Management
#### POST /api/client/profile
- **Description:** Create/Update client profile
- **Access:** Authenticated (Client)
- **Request Body:**
  ```json
  {
    "companyName": "string",
    "industry": "string",
    "primaryLocation": "string",
    "contactNumber": "string"
  }
  ```

### 3. Service Provider Management
#### POST /api/provider/profile
- **Description:** Create/Update provider profile
- **Access:** Authenticated (Provider)
- **Request Body:**
  ```json
  {
    "contactNumber": "string",
    "companyName": "string",
    "companyLocation": "string",
    "companyDescription": "string",
    "companySpecialization": ["string"],
    "companyLogo": "file",
    "proceduresFile": "file"
  }
  ```

### 4. Inspector Management
#### POST /api/inspector/profile
- **Description:** Create/Update inspector profile
- **Access:** Authenticated (Inspector)
- **Request Body:**
  ```json
  {
    "fullName": "string",
    "contactNumber": "string",
    "associationType": "string",
    "companyName": "string",
    "hourlyRate": "number",
    "monthlyRate": "number",
    "resume": "file"
  }
  ```

### 5. Job Request Management
#### POST /api/job-requests
- **Description:** Create new job request
- **Access:** Authenticated (Client)
- **Request Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "location": "string",
    "region": "string",
    "requiredServices": ["serviceId"],
    "serviceQuantities": ["number"],
    "projectDuration": "string",
    "numInspectors": "number",
    "estimatedTotal": "number",
    "urgencyLevel": "string",
    "preferredStartDate": "date"
  }
  ```

### 6. Payment Processing
#### POST /api/payments/create-payment-intent
- **Description:** Create payment intent
- **Access:** Authenticated (Client)
- **Request Body:**
  ```json
  {
    "jobId": "string",
    "amount": "number",
    "currency": "string",
    "description": "string"
  }
  ```

### 7. Equipment Management
#### POST /api/equipment
- **Description:** Register new equipment
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "method": "string",
    "manufacturer": "string",
    "model": "string",
    "serialNumber": "string",
    "calibrationExpiry": "date"
  }
  ```

### 8. Certification Management
#### POST /api/certifications
- **Description:** Upload new certification
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "certificateName": "string",
    "certificationBody": "string",
    "category": "string",
    "issuedYear": "string",
    "expiryDate": "date",
    "certificate": "file"
  }
  ```

### 9. AI Procedure Generation
#### POST /api/gemini/generate
- **Description:** Generate NDT procedure
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "userInput": "string (NDT method and requirements)"
  }
  ```

## Database Models

### User Model
- Core user information
- Authentication details
- Role-based access control

### ClientProfile Model
- Company information
- Industry details
- Contact information

### ServiceProviderProfile Model
- Company details
- Services offered
- Documentation and certifications

### InspectorProfile Model
- Personal/Professional information
- Certifications
- Availability and rates

### JobRequest Model
- Project details
- Service requirements
- Cost and timeline information

### Payment Model
- Transaction details
- Payment status
- Fee calculations

### Equipment Model
- Equipment details
- Calibration information
- Usage tracking

### Certification Model
- Certificate details
- Validity period
- Verification status

## Security Features
- JWT-based authentication
- Role-based access control
- Input validation
- File upload security
- Payment data security
- API rate limiting

## Scheduled Jobs
1. Certificate Expiry Alerts
   - Daily check for expiring certifications
   - Email notifications to users

2. Skill Matrix Expiry Alerts
   - Monitor technician certifications
   - Alert on approaching expiration

## Error Handling
- Standardized error responses
- Detailed error logging
- Custom error classes
- Async error wrapper

## API Response Format
```json
{
  "statusCode": "number",
  "data": "object|array|null",
  "message": "string",
  "success": "boolean"
}
```

## Environment Variables
```env
PORT=3000
MONGODB_URI=
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY= 
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_PASS=
EMAIL_USER=
EMAIL_VERIFICATION_SECRET=
FRONTEND_URL=
STRIPE_SECRET_KEY=
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
MS_EMAIL=
```

## Setup Instructions
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment
- Configured for Vercel deployment
- Environment variable setup required
- Database connection string configuration
- API key configuration for third-party services

## Rate Limiting
- API rate limiting implemented
- Different limits for authenticated/unauthenticated users
- IP-based and user-based limiting

## File Upload Limits
- Maximum file size: 5MB
- Supported formats: 
  - Images: jpg, jpeg, png
  - Documents: pdf
  - Resume: pdf, doc, docx

## Testing
- Unit tests for utilities
- Integration tests for APIs
- Authentication test suite
- Payment processing tests

## 📚 Documentation Resources

### Complete Documentation Suite

This project includes comprehensive documentation across multiple files:

#### 📖 Main Documentation
- **[README.md](./README.md)** - Project overview, quick start guide, and basic setup
- **[backend_documentation.md](./backend_documentation.md)** - This file: Complete technical documentation

#### 🔧 API Documentation
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API endpoint reference with examples
- **[user_api_documentation.md](./user_api_documentation.md)** - User-friendly API guide with SDK examples

#### 🚀 Deployment & Development
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive deployment instructions for all platforms
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Development standards, patterns, and best practices

#### Third-Party Documentation
- **[Express.js Documentation](https://expressjs.com/)**
- **[MongoDB Documentation](https://docs.mongodb.com/)**
- **[Mongoose ODM Guide](https://mongoosejs.com/docs/guide.html)**
- **[Stripe API Reference](https://stripe.com/docs/api)**
- **[Cloudinary Documentation](https://cloudinary.com/documentation)**
- **[Google Gemini AI Documentation](https://ai.google.dev/docs)**

### Quick Navigation

| Need to... | See Documentation |
|------------|------------------|
| Get started quickly | [README.md](./README.md) |
| Deploy the application | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| Understand API endpoints | [API_REFERENCE.md](./API_REFERENCE.md) |
| Integrate with the API | [user_api_documentation.md](./user_api_documentation.md) |
| Contribute to development | [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) |
| Understand the architecture | This file (backend_documentation.md) |

### Getting Help

#### For Users
- Review the [User API Documentation](./user_api_documentation.md)
- Check the [API Reference](./API_REFERENCE.md) for specific endpoints
- Use the contact form endpoint for support requests

#### For Developers
- Read the [Developer Guide](./DEVELOPER_GUIDE.md) for coding standards
- Check the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for environment setup
- Review existing code patterns before implementing new features

#### For System Administrators
- Follow the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for production setup
- Monitor the scheduled jobs (cronJobs directory)
- Review security considerations in deployment documentation

---

## 🤝 Support & Contribution

### Getting Support
- **Documentation**: Start with the relevant documentation file above
- **Issues**: Create GitHub issues for bugs or feature requests
- **Contact**: Use the contact form endpoint for general inquiries

### Contributing
1. Read the [Developer Guide](./DEVELOPER_GUIDE.md)
2. Follow the established coding standards
3. Submit pull requests with clear descriptions
4. Ensure all tests pass before submission

### Maintenance
- Regular dependency updates
- Security patches
- Performance optimizations
- Documentation updates
