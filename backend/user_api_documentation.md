# NDT Connect API Documentation

## Base URL
```
Production: https://your-domain.vercel.app
Development: http://localhost:8000
```

All API endpoints are prefixed with `/api/v1/`

## Authentication

### Overview
The API uses JWT (JSON Web Tokens) for authentication with both access and refresh tokens:
- **Access Token**: Short-lived (1 day), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

### Headers
Include the access token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## Response Format

All API responses follow this standardized format:

### Success Response
```json
{
  "statusCode": 200,
  "data": {
    // Response data here
  },
  "message": "Success message",
  "success": true
}
```

### Error Response
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false
}
```

## User Management

### Register User
**POST** `/api/v1/users/register`

Register a new user with email verification.

**Request Body (multipart/form-data):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "client",
  "acceptedTerms": true,
  "location": "New York, USA",
  "currency": "USD",
  "avatar": "file" // Image file
}
```

**Roles:**
- `client` - Companies needing NDT services
- `provider` - Companies offering NDT services  
- `inspector` - Certified professionals

**Success Response:**
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "isEmailVerified": false,
      "avatar": "cloudinary_url",
      "location": "New York, USA",
      "currency": "USD"
    }
  },
  "message": "User registered successfully. Please check your email for verification.",
  "success": true
}
```

### Login User
**POST** `/api/v1/users/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "isEmailVerified": true,
      "avatar": "cloudinary_url"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "message": "User logged in successfully",
  "success": true
}
```

### Get Current User
**GET** `/api/v1/users/current-user`

Get currently authenticated user details.

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Success Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "isEmailVerified": true,
    "avatar": "cloudinary_url",
    "location": "New York, USA",
    "currency": "USD"
  },
  "message": "Current user details fetched successfully",
  "success": true
}
```

### Refresh Access Token
**POST** `/api/v1/users/refresh-token`

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

### Logout User
**POST** `/api/v1/users/logout`

Invalidate user tokens and logout.

**Headers Required:**
```
Authorization: Bearer <access_token>
```

### Update User Account
**PATCH** `/api/v1/users/update-account`

Update user account information.

**Request Body:**
```json
{
  "name": "Updated Name",
  "location": "Updated Location",
  "currency": "EUR"
}
```

### Change Password
**PATCH** `/api/v1/users/change-password`

Change user password.

**Request Body:**
```json
{
  "oldPassword": "currentPassword",
  "newPassword": "newSecurePassword"
}
```

### Update Avatar
**PATCH** `/api/v1/users/avatar`

Update user profile picture.

**Request Body (multipart/form-data):**
```json
{
  "avatar": "file" // New image file
}
```

## Client Profile Management

### Create/Update Client Profile
**POST** `/api/v1/client-routes/profile`

Create or update client company profile.

**Access:** Client role required

**Request Body:**
```json
{
  "companyName": "ABC Manufacturing",
  "industry": "Aerospace",
  "primaryLocation": "California, USA",
  "contactNumber": "+1-555-0123"
}
```

### Get Client Profile
**GET** `/api/v1/client-routes/profile`

Get current user's client profile.

**Access:** Client role required

## Service Provider Management

### Create/Update Provider Profile
**POST** `/api/v1/service-provider/profile`

Create or update service provider profile.

**Access:** Provider role required

**Request Body (multipart/form-data):**
```json
{
  "contactNumber": "+1-555-0456",
  "companyName": "NDT Solutions Inc",
  "companyLocation": "Texas, USA",
  "companyDescription": "Leading NDT service provider with 20+ years experience",
  "companySpecialization": ["Ultrasonic Testing", "Radiographic Testing"],
  "companyLogo": "file", // Company logo image
  "proceduresFile": "file" // PDF file with procedures
}
```

### Get All Service Providers
**GET** `/api/v1/service-provider/all`

Get list of all service providers.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of results per page

### Get Provider by ID
**GET** `/api/v1/service-provider/:id`

Get specific service provider details.

## Inspector Management

### Create/Update Inspector Profile
**POST** `/api/v1/inspectors/profile`

Create or update inspector profile.

**Access:** Inspector role required

**Request Body (multipart/form-data):**
```json
{
  "fullName": "Dr. Jane Smith",
  "contactNumber": "+1-555-0789",
  "associationType": "Level III Certified",
  "companyName": "Independent Inspector",
  "hourlyRate": 150,
  "monthlyRate": 12000,
  "resume": "file" // PDF resume file
}
```

### Get All Inspectors
**GET** `/api/v1/inspectors/all`

Get list of all inspectors.

## Job Request Management

### Create Job Request
**POST** `/api/v1/job-requests`

Create a new job request.

**Access:** Client role required

**Request Body:**
```json
{
  "title": "Pipeline Integrity Assessment",
  "description": "Comprehensive NDT testing for offshore pipeline",
  "location": "Gulf of Mexico",
  "region": "Offshore",
  "requiredServices": ["service_id_1", "service_id_2"],
  "serviceQuantities": [5, 3],
  "projectDuration": "2 weeks",
  "numInspectors": 2,
  "estimatedTotal": 25000,
  "urgencyLevel": "high",
  "preferredStartDate": "2024-03-15T00:00:00.000Z"
}
```

### Get User's Job Requests
**GET** `/api/v1/job-requests`

Get all job requests created by current user.

**Query Parameters:**
- `status` (optional): Filter by status (pending, active, completed, cancelled)
- `page` (optional): Page number
- `limit` (optional): Results per page

### Get Job Request by ID
**GET** `/api/v1/job-requests/:id`

Get specific job request details.

### Update Job Request
**PATCH** `/api/v1/job-requests/:id`

Update job request details.

**Access:** Job creator or assigned provider

## Equipment Management

### Register Equipment
**POST** `/api/v1/equipments`

Register new equipment.

**Request Body:**
```json
{
  "method": "Ultrasonic Testing",
  "manufacturer": "Olympus",
  "model": "EPOCH 650",
  "serialNumber": "EP650-12345",
  "calibrationExpiry": "2024-12-31T00:00:00.000Z"
}
```

### Get User's Equipment
**GET** `/api/v1/equipments`

Get all equipment registered by current user.

### Update Equipment
**PATCH** `/api/v1/equipments/:id`

Update equipment details.

## Certification Management

### Upload Certification
**POST** `/api/v1/certificates`

Upload new certification.

**Request Body (multipart/form-data):**
```json
{
  "certificateName": "ASNT Level III UT",
  "certificationBody": "ASNT",
  "category": "Ultrasonic Testing",
  "issuedYear": "2023",
  "expiryDate": "2026-12-31T00:00:00.000Z",
  "certificate": "file" // PDF certificate file
}
```

### Get User's Certifications
**GET** `/api/v1/certificates`

Get all certifications for current user.

### Delete Certification
**DELETE** `/api/v1/certificates/:id`

Delete a certification.

## Payment Processing

### Create Payment Intent
**POST** `/api/v1/payments/create-payment-intent`

Create Stripe payment intent for job.

**Request Body:**
```json
{
  "jobId": "job_request_id",
  "amount": 25000,
  "currency": "usd",
  "description": "Payment for Pipeline Integrity Assessment"
}
```

### Confirm Payment
**POST** `/api/v1/payments/confirm-payment`

Confirm payment completion.

**Request Body:**
```json
{
  "paymentIntentId": "pi_stripe_payment_intent_id",
  "jobId": "job_request_id"
}
```

### Get Payment History
**GET** `/api/v1/payments/history`

Get user's payment history.

## AI Procedure Generation

### Generate NDT Procedure
**POST** `/api/v1/gemini/generate`

Generate NDT procedure using AI.

**Request Body:**
```json
{
  "userInput": "Generate ultrasonic testing procedure for weld inspection in pressure vessels according to ASME standards"
}
```

**Success Response:**
```json
{
  "statusCode": 200,
  "data": {
    "generatedProcedure": "# Ultrasonic Testing Procedure for Weld Inspection\n\n## 1. Scope\n...",
    "htmlContent": "<h1>Ultrasonic Testing Procedure for Weld Inspection</h1>..."
  },
  "message": "Procedure generated successfully",
  "success": true
}
```

## Service Management

### Get All Services
**GET** `/api/v1/service/all`

Get list of all available NDT services.

### Create Service
**POST** `/api/v1/service`

Create new service (Admin only).

## Contact

### Send Contact Message
**POST** `/api/v1/contact/send`

Send contact form message.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry about services",
  "message": "I would like to know more about your NDT services."
}
```

## Error Codes

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Authentication Errors
- `401` - "Access token required"
- `401` - "Invalid access token"
- `401` - "Access token expired"
- `403` - "Email not verified"

### Validation Errors
- `400` - "All fields are required"
- `400` - "Invalid email format"
- `400` - "Password must be at least 6 characters"
- `400` - "Invalid role selected"

## Rate Limits

- **Authentication endpoints**: 5 requests per minute per IP
- **File uploads**: 3 requests per minute per user
- **General API**: 100 requests per minute per user
- **Payment endpoints**: 10 requests per minute per user

## File Upload Specifications

### Supported File Types
- **Images**: jpg, jpeg, png, gif
- **Documents**: pdf, doc, docx
- **Maximum file size**: 5MB

### Image Requirements
- **Avatar images**: Recommended 400x400px minimum
- **Company logos**: Recommended 200x200px minimum
- **Supported formats**: JPG, JPEG, PNG, GIF

### Document Requirements
- **Certificates**: PDF format only
- **Procedures**: PDF format only
- **Resumes**: PDF, DOC, DOCX formats

## Webhooks

### Stripe Payment Webhooks
Configure webhook endpoint: `/api/v1/payments/webhook`

**Events handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### Email Delivery Webhooks
Configure webhook endpoint: `/api/v1/email/webhook`

**Events handled:**
- Email delivery confirmation
- Email bounce notifications

## SDK Examples

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://your-domain.vercel.app/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login
const login = async (email, password) => {
  try {
    const response = await api.post('/users/login', {
      email,
      password
    });
    
    // Store tokens
    const { accessToken, refreshToken } = response.data.data;
    api.defaults.headers.Authorization = `Bearer ${accessToken}`;
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response.data.message);
  }
};

// Create job request
const createJobRequest = async (jobData) => {
  try {
    const response = await api.post('/job-requests', jobData);
    return response.data;
  } catch (error) {
    console.error('Job creation failed:', error.response.data.message);
  }
};
```

### cURL Examples

**Login:**
```bash
curl -X POST https://your-domain.vercel.app/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Get current user:**
```bash
curl -X GET https://your-domain.vercel.app/api/v1/users/current-user \
  -H "Authorization: Bearer your_access_token"
```

**Create job request:**
```bash
curl -X POST https://your-domain.vercel.app/api/v1/job-requests \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pipeline Inspection",
    "description": "Urgent pipeline integrity assessment",
    "location": "Texas, USA",
    "estimatedTotal": 15000
  }'
```

---

## Support

For API support and questions:
- Email: info@ndt-connect.com
- Documentation: [Backend Documentation](./backend_documentation.md)
- Issues: GitHub Issues