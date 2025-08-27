# NDT Connect API Reference

## Table of Contents
1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Client Profiles](#client-profiles)
4. [Service Provider Profiles](#service-provider-profiles)
5. [Inspector Profiles](#inspector-profiles)
6. [Job Requests](#job-requests)
7. [Equipment Management](#equipment-management)
8. [Certifications](#certifications)
9. [Services](#services)
10. [Payments](#payments)
11. [AI Procedures](#ai-procedures)
12. [Admin Functions](#admin-functions)

---

## Authentication

### Register User
```http
POST /api/v1/users/register
Content-Type: multipart/form-data
```

**Form Fields:**
- `name` (string, required)
- `email` (string, required)
- `password` (string, required)
- `role` (string, required): "client", "provider", or "inspector"
- `acceptedTerms` (boolean, required)
- `location` (string, required)
- `currency` (string, required)
- `avatar` (file, required): Image file

### Verify Email
```http
GET /api/v1/users/verify-email?token={verification_token}
```

### Login
```http
POST /api/v1/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Refresh Token
```http
POST /api/v1/users/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Logout
```http
POST /api/v1/users/logout
Authorization: Bearer {access_token}
```

---

## User Management

### Get Current User
```http
GET /api/v1/users/current-user
Authorization: Bearer {access_token}
```

### Update User Avatar
```http
PATCH /api/v1/users/avatar
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

avatar: {image_file}
```

### Change Password
```http
PATCH /api/v1/users/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

### Get All Users (Admin)
```http
GET /api/v1/users/all
Authorization: Bearer {admin_access_token}
```

### Get User Statistics (Admin)
```http
GET /api/v1/users/stats
Authorization: Bearer {admin_access_token}
```

---

## Client Profiles

### Create/Update Client Profile
```http
POST /api/v1/client-routes/profile
Authorization: Bearer {client_access_token}
Content-Type: application/json

{
  "companyName": "ABC Corp",
  "industry": "Manufacturing",
  "primaryLocation": "New York, USA",
  "contactNumber": "+1-555-0123"
}
```

### Get Client Profile
```http
GET /api/v1/client-routes/profile
Authorization: Bearer {client_access_token}
```

### Get All Clients
```http
GET /api/v1/client-routes/all
Authorization: Bearer {access_token}
```

---

## Service Provider Profiles

### Create/Update Provider Profile
```http
POST /api/v1/service-provider/profile
Authorization: Bearer {provider_access_token}
Content-Type: multipart/form-data
```

**Form Fields:**
- `contactNumber` (string)
- `companyName` (string)
- `companyLocation` (string)
- `companyDescription` (string)
- `companySpecialization` (array of strings)
- `companyLogo` (file, optional)
- `proceduresFile` (file, optional)

### Get All Service Providers
```http
GET /api/v1/service-provider/all
Authorization: Bearer {access_token}
```

### Get Provider by ID
```http
GET /api/v1/service-provider/{provider_id}
Authorization: Bearer {access_token}
```

### Get Provider Profile
```http
GET /api/v1/service-provider/profile
Authorization: Bearer {provider_access_token}
```

---

## Inspector Profiles

### Create/Update Inspector Profile
```http
POST /api/v1/inspectors/profile
Authorization: Bearer {inspector_access_token}
Content-Type: multipart/form-data
```

**Form Fields:**
- `fullName` (string)
- `contactNumber` (string)
- `associationType` (string)
- `companyName` (string)
- `hourlyRate` (number)
- `monthlyRate` (number)
- `resume` (file, optional)

### Get All Inspectors
```http
GET /api/v1/inspectors/all
Authorization: Bearer {access_token}
```

### Get Inspector Profile
```http
GET /api/v1/inspectors/profile
Authorization: Bearer {inspector_access_token}
```

---

## Job Requests

### Create Job Request
```http
POST /api/v1/job-requests
Authorization: Bearer {client_access_token}
Content-Type: application/json

{
  "title": "Pipeline Inspection",
  "description": "Comprehensive NDT testing required",
  "location": "Texas, USA",
  "region": "Southwest",
  "requiredServices": ["service_id_1", "service_id_2"],
  "serviceQuantities": [5, 3],
  "projectDuration": "2 weeks",
  "numInspectors": 2,
  "estimatedTotal": 25000,
  "urgencyLevel": "high",
  "preferredStartDate": "2024-03-15"
}
```

### Get All Job Requests (User's)
```http
GET /api/v1/job-requests
Authorization: Bearer {access_token}
```

### Get Job Request by ID
```http
GET /api/v1/job-requests/{job_id}
Authorization: Bearer {access_token}
```

### Update Job Request
```http
PATCH /api/v1/job-requests/{job_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "estimatedTotal": 30000
}
```

### Delete Job Request
```http
DELETE /api/v1/job-requests/{job_id}
Authorization: Bearer {access_token}
```

### Update Job Status
```http
PATCH /api/v1/job-requests/{job_id}/status
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "active" // pending, active, completed, cancelled
}
```

### Add Quotation
```http
POST /api/v1/job-requests/{job_id}/quotation
Authorization: Bearer {provider_access_token}
Content-Type: application/json

{
  "amount": 25000,
  "description": "Detailed quotation for services",
  "estimatedDuration": "2 weeks",
  "terms": "Standard terms and conditions"
}
```

### Get Quotation History
```http
GET /api/v1/job-requests/{job_id}/quotations
Authorization: Bearer {access_token}
```

### Update Quotation Status
```http
PATCH /api/v1/job-requests/{job_id}/quotation/{quotation_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "accepted" // pending, accepted, rejected
}
```

### Add Internal Note
```http
POST /api/v1/job-requests/{job_id}/notes
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "note": "Internal note about the job",
  "isPrivate": true
}
```

### Add Attachment
```http
POST /api/v1/job-requests/{job_id}/attachments
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

attachment: {file}
description: "File description"
```

### Get Job Statistics
```http
GET /api/v1/job-requests/stats
Authorization: Bearer {access_token}
```

### Get Jobs by Provider
```http
GET /api/v1/job-requests/provider/{provider_id}
Authorization: Bearer {access_token}
```

### Get Jobs by Client
```http
GET /api/v1/job-requests/client/{client_id}
Authorization: Bearer {access_token}
```

### Add Client Rating
```http
POST /api/v1/job-requests/{job_id}/rating
Authorization: Bearer {client_access_token}
Content-Type: application/json

{
  "rating": 5,
  "review": "Excellent service quality",
  "providerId": "provider_id"
}
```

### Generate Job Report
```http
GET /api/v1/job-requests/{job_id}/report
Authorization: Bearer {access_token}
```

---

## Equipment Management

### Register Equipment
```http
POST /api/v1/equipments
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "method": "Ultrasonic Testing",
  "manufacturer": "Olympus",
  "model": "EPOCH 650",
  "serialNumber": "EP650-12345",
  "calibrationExpiry": "2024-12-31"
}
```

### Get User's Equipment
```http
GET /api/v1/equipments
Authorization: Bearer {access_token}
```

### Update Equipment
```http
PATCH /api/v1/equipments/{equipment_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "calibrationExpiry": "2025-12-31",
  "status": "active"
}
```

### Delete Equipment
```http
DELETE /api/v1/equipments/{equipment_id}
Authorization: Bearer {access_token}
```

---

## Certifications

### Upload Certification
```http
POST /api/v1/certificates
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Form Fields:**
- `certificateName` (string)
- `certificationBody` (string)
- `category` (string)
- `issuedYear` (string)
- `expiryDate` (date)
- `certificate` (file): PDF file

### Get User's Certifications
```http
GET /api/v1/certificates
Authorization: Bearer {access_token}
```

### Update Certification
```http
PATCH /api/v1/certificates/{certificate_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "certificateName": "Updated Certificate Name",
  "expiryDate": "2026-12-31"
}
```

### Delete Certification
```http
DELETE /api/v1/certificates/{certificate_id}
Authorization: Bearer {access_token}
```

---

## Services

### Get All Services
```http
GET /api/v1/service/all
Authorization: Bearer {access_token}
```

### Create Service (Admin)
```http
POST /api/v1/service
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "name": "Ultrasonic Testing",
  "description": "Non-destructive testing using ultrasonic waves",
  "category": "NDT",
  "basePrice": 500
}
```

### Update Service (Admin)
```http
PATCH /api/v1/service/{service_id}
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "name": "Updated Service Name",
  "basePrice": 600
}
```

---

## Service Offered Management

### Create Service Offering
```http
POST /api/v1/offered-services
Authorization: Bearer {provider_access_token}
Content-Type: application/json

{
  "serviceId": "service_id",
  "price": 750,
  "description": "Custom service offering",
  "estimatedDuration": "3 days"
}
```

### Get Provider's Offered Services
```http
GET /api/v1/offered-services
Authorization: Bearer {provider_access_token}
```

### Update Service Offering
```http
PATCH /api/v1/offered-services/{offering_id}
Authorization: Bearer {provider_access_token}
Content-Type: application/json

{
  "price": 800,
  "description": "Updated service description"
}
```

---

## Skill Matrix Management

### Create Skill Matrix Entry
```http
POST /api/v1/skill-matrix
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Form Fields:**
- `technicianName` (string)
- `method` (string)
- `level` (string)
- `certificationBody` (string)
- `issuedDate` (date)
- `expiryDate` (date)
- `certificate` (file, optional)

### Get Skill Matrix
```http
GET /api/v1/skill-matrix
Authorization: Bearer {access_token}
```

---

## Payments

### Create Payment Intent
```http
POST /api/v1/payments/create-payment-intent
Authorization: Bearer {client_access_token}
Content-Type: application/json

{
  "jobId": "job_request_id",
  "amount": 25000,
  "currency": "usd",
  "description": "Payment for NDT services"
}
```

### Confirm Payment
```http
POST /api/v1/payments/confirm-payment
Authorization: Bearer {client_access_token}
Content-Type: application/json

{
  "paymentIntentId": "pi_stripe_payment_intent_id",
  "jobId": "job_request_id"
}
```

### Get Payment History
```http
GET /api/v1/payments/history
Authorization: Bearer {access_token}
```

### Process Withdrawal
```http
POST /api/v1/payments/withdraw
Authorization: Bearer {provider_access_token}
Content-Type: application/json

{
  "amount": 5000,
  "accountDetails": {
    "accountNumber": "1234567890",
    "routingNumber": "123456789",
    "accountHolderName": "Company Name"
  }
}
```

---

## AI Procedures

### Generate NDT Procedure
```http
POST /api/v1/gemini/generate
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "userInput": "Generate ultrasonic testing procedure for weld inspection in pressure vessels according to ASME standards"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "generatedProcedure": "# Ultrasonic Testing Procedure\n\n## 1. Scope...",
    "htmlContent": "<h1>Ultrasonic Testing Procedure</h1>..."
  },
  "message": "Procedure generated successfully",
  "success": true
}
```

---

## Admin Functions

### Get Admin Settings
```http
GET /api/v1/admin/settings
Authorization: Bearer {admin_access_token}
```

### Update Admin Settings
```http
PATCH /api/v1/admin/settings
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "platformFeePercentage": 5,
  "minWithdrawalAmount": 100,
  "maxFileUploadSize": 5242880
}
```

### Get Platform Statistics
```http
GET /api/v1/admin/stats
Authorization: Bearer {admin_access_token}
```

---

## Contact

### Send Contact Message
```http
POST /api/v1/contact/send
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Service Inquiry",
  "message": "I would like to know more about your NDT services."
}
```

---

## Response Status Codes

### Success Codes
- `200` - OK (Request successful)
- `201` - Created (Resource created successfully)
- `204` - No Content (Request successful, no data returned)

### Client Error Codes
- `400` - Bad Request (Invalid request data)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `409` - Conflict (Resource already exists)
- `422` - Unprocessable Entity (Validation errors)

### Server Error Codes
- `500` - Internal Server Error (Server-side error)
- `503` - Service Unavailable (Service temporarily unavailable)

---

## Query Parameters

### Pagination
Most list endpoints support pagination:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `sort` (string) - Sort field
- `order` (string) - Sort order: "asc" or "desc"

### Filtering
- `status` - Filter by status
- `role` - Filter by user role
- `category` - Filter by category
- `dateFrom` - Start date for filtering
- `dateTo` - End date for filtering

### Search
- `search` - Search term for text fields
- `tags` - Filter by tags

---

## File Upload Specifications

### Supported File Types
- **Images**: jpg, jpeg, png, gif (max 5MB)
- **Documents**: pdf, doc, docx (max 5MB)
- **Certificates**: pdf only (max 5MB)

### Upload Headers
```http
Content-Type: multipart/form-data
```

### Error Responses for File Uploads
```json
{
  "statusCode": 400,
  "data": null,
  "message": "File size exceeds limit of 5MB",
  "success": false
}
```

---

## Authentication Headers

### Required Headers
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Optional Headers
```http
X-Request-ID: {unique_request_id}
X-Client-Version: {client_version}
```

---

## Rate Limiting

### Limits by Endpoint Type
- **Authentication**: 5 requests/minute per IP
- **File uploads**: 3 requests/minute per user
- **Payment**: 10 requests/minute per user
- **General API**: 100 requests/minute per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```


---

For more detailed information, see the [Backend Documentation](./backend_documentation.md) and [User API Documentation](./user_api_documentation.md).
