# NDT Connect Backend

A comprehensive backend service for a Non-Destructive Testing (NDT) service marketplace platform that connects clients with certified service providers and inspectors.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Cloudinary account
- Stripe account (for payments)
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=8000
   MONGODB_URI=your_mongodb_connection_string
   CORS_ORIGIN=*
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRY=7d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   EMAIL_PASS=your_email_password
   EMAIL_USER=your_email_address
   EMAIL_VERIFICATION_SECRET=your_email_verification_secret
   FRONTEND_URL=your_frontend_url
   STRIPE_SECRET_KEY=your_stripe_secret_key
   AZURE_TENANT_ID=your_azure_tenant_id
   AZURE_CLIENT_ID=your_azure_client_id
   AZURE_CLIENT_SECRET=your_azure_client_secret
   MS_EMAIL=your_microsoft_email
   ```

4. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📊 Project Overview

NDT Connect is a platform that facilitates connections between:
- **Clients**: Companies needing NDT services
- **Service Providers**: Companies offering NDT services
- **Inspectors**: Certified professionals performing inspections

### Key Features
- ✅ User authentication with role-based access
- ✅ Profile management for all user types
- ✅ Job request and management system
- ✅ Stripe payment processing
- ✅ Equipment and certification tracking
- ✅ AI-powered NDT procedure generation
- ✅ Automated expiry alerts for certifications
- ✅ File upload and management
- ✅ Email notifications
- ✅ Admin settings and controls

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access & Refresh tokens)
- **File Storage**: Cloudinary
- **Payment Processing**: Stripe
- **Email Service**: Nodemailer with Microsoft Graph
- **AI Integration**: Google Gemini API
- **Scheduling**: Node-cron

### Project Structure
```
backend/
├── src/
│   ├── app.js              # Express application setup
│   ├── index.js            # Server entry point
│   ├── constants.js        # Application constants
│   │
│   ├── controllers/        # Request handlers
│   │   ├── User.controller.js
│   │   ├── ServiceProvider.controller.js
│   │   ├── JobRequest.controller.js
│   │   └── ...
│   │
│   ├── models/            # Database schemas
│   │   ├── User.model.js
│   │   ├── JobRequest.model.js
│   │   └── ...
│   │
│   ├── routes/            # API route definitions
│   │   ├── user.routes.js
│   │   ├── jobRequest.routes.js
│   │   └── ...
│   │
│   ├── middlewares/       # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── multer.middleware.js
│   │   └── isAdmin.js
│   │
│   ├── utils/             # Utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── AsyncHandler.js
│   │   ├── Cloudinary.js
│   │   └── SendMail.js
│   │
│   ├── cronJobs/          # Scheduled tasks
│   │   ├── certificateExpiryAlert.js
│   │   └── skillMatrixExpiryAlert.js
│   │
│   └── db/                # Database connection
│       └── index.js
│
├── public/                # Static files and uploads
│   └── temp/             # Temporary file storage
│
├── index.js              # Application entry point
├── package.json          # Dependencies and scripts
├── vercel.json           # Vercel deployment config
└── .env                  # Environment variables
```

## 🔌 API Endpoints

The API follows RESTful conventions with the base URL pattern: `/api/v1/`

### Authentication Endpoints
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/users/refresh-token` - Refresh access token

### User Management
- `GET /api/v1/users/current-user` - Get current user
- `PATCH /api/v1/users/update-account` - Update user details
- `PATCH /api/v1/users/avatar` - Update user avatar
- `PATCH /api/v1/users/change-password` - Change password

### Service Provider Endpoints
- `POST /api/v1/service-provider/profile` - Create/update provider profile
- `GET /api/v1/service-provider/all` - Get all providers
- `GET /api/v1/service-provider/:id` - Get provider by ID

### Job Request Management
- `POST /api/v1/job-requests` - Create job request
- `GET /api/v1/job-requests` - Get user's job requests
- `GET /api/v1/job-requests/:id` - Get specific job request
- `PATCH /api/v1/job-requests/:id` - Update job request

### Payment Processing
- `POST /api/v1/payments/create-payment-intent` - Create payment intent
- `POST /api/v1/payments/confirm-payment` - Confirm payment
- `GET /api/v1/payments/history` - Get payment history

For complete API documentation, see [`backend_documentation.md`](./backend_documentation.md)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for clients, providers, and inspectors
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Secure file handling with type and size restrictions
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Rate Limiting**: API rate limiting to prevent abuse

## 🗃️ Database Models

### Core Models
- **User**: Base user information and authentication
- **ClientProfile**: Client company information
- **ServiceProviderProfile**: Provider company details
- **InspectorProfile**: Inspector credentials and rates
- **JobRequest**: Project details and requirements
- **Payment**: Transaction records and status
- **Equipment**: Equipment registry and calibration
- **CompanyCertification**: Certification management
- **SkillMatrix**: Technician qualifications

## 🤖 AI Integration

The platform integrates with Google Gemini AI to generate NDT procedures based on user requirements:

```javascript
POST /api/v1/gemini/generate
{
  "userInput": "Generate ultrasonic testing procedure for weld inspection"
}
```

## 📧 Email Features

- User registration verification
- Password reset emails
- Certification expiry alerts
- Job status notifications
- Contact form submissions

## 🔄 Scheduled Jobs

### Certificate Expiry Alerts
- **Frequency**: Daily at 9:00 AM
- **Purpose**: Notify users of expiring certifications
- **File**: `src/cronJobs/certificateExpiryAlert.js`

### Skill Matrix Expiry Alerts
- **Frequency**: Daily at 9:00 AM
- **Purpose**: Alert about expiring technician qualifications
- **File**: `src/cronJobs/skillMatrixExpiryAlert.js`

## 🚀 Deployment

### Vercel Deployment
The application is configured for Vercel deployment with `vercel.json`:

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
  ]
}
```

### Environment Variables Setup
Ensure all required environment variables are configured in your deployment platform.

## 📝 Development Guidelines

### Code Style
- Use ES6+ features and modules
- Follow consistent naming conventions
- Implement proper error handling
- Add comprehensive comments
- Use async/await for asynchronous operations

### Error Handling
All routes use the `AsyncHandler` wrapper for consistent error handling:

```javascript
const example = AsyncHandler(async (req, res) => {
  // Route logic here
  throw new ApiError(400, "Error message");
});
```

### API Response Format
Standardized response format using `ApiResponse`:

```javascript
return res.status(200).json(
  new ApiResponse(200, data, "Success message")
);
```

## 🔗 External Resources

- [Database Models Diagram](https://app.eraser.io/workspace/nYH5brF1MwhB19uValrB?origin=share)
- [API Documentation](./backend_documentation.md)
- [User API Reference](./user_api_documentation.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request


For detailed API documentation, please refer to the [`backend_documentation.md`](./backend_documentation.md) file.