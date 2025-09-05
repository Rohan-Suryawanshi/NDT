# NDT Connect Developer Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Project Architecture](#project-architecture)
3. [Code Standards](#code-standards)
4. [Database Design](#database-design)
5. [API Development](#api-development)
6. [Authentication & Authorization](#authentication--authorization)
7. [File Handling](#file-handling)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Contributing](#contributing)

---

## Getting Started

### Development Environment Setup

#### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Git
- Code editor (VS Code recommended)

#### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- MongoDB for VS Code
- REST Client
- GitLens
- Prettier - Code formatter
- ESLint

#### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

---

## Project Architecture

### Folder Structure
```
src/
├── controllers/     # Business logic and request handlers
├── models/         # Database schemas and models
├── routes/         # API route definitions
├── middlewares/    # Custom middleware functions
├── utils/          # Utility functions and helpers
├── cronJobs/       # Scheduled background tasks
└── db/             # Database connection configuration
```

### Design Patterns

#### MVC Pattern
- **Models**: Database schemas and data validation
- **Views**: JSON API responses (no traditional views)
- **Controllers**: Business logic and request handling

#### Middleware Pattern
```javascript
// Example middleware chain
app.use(cors());
app.use(express.json());
app.use(verifyJWT);        // Authentication
app.use(rateLimiter);      // Rate limiting
app.use(validateInput);    // Input validation
```

#### Repository Pattern (Recommended for complex queries)
```javascript
// userRepository.js
export class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ email });
  }
  
  async createUser(userData) {
    return await User.create(userData);
  }
}
```

---

## Code Standards

### ES6+ Features
```javascript
// Use ES6 modules
import { User } from "../models/User.model.js";

// Use destructuring
const { name, email, password } = req.body;

// Use template literals
const message = `Welcome ${name}!`;

// Use arrow functions for callbacks
const users = await User.find().map(user => user.toJSON());

// Use async/await instead of promises
const user = await User.findById(userId);
```

### Naming Conventions

#### Variables and Functions
```javascript
// camelCase for variables and functions
const userEmail = "user@example.com";
const getUserById = async (id) => { };

// PascalCase for classes and constructors
class UserService { }
const userInstance = new User();

// UPPER_CASE for constants
const MAX_FILE_SIZE = 5 * 1024 * 1024;
```

#### Files and Directories
```
// camelCase for utility files
sendEmail.js
validateInput.js

// PascalCase for models and classes
User.model.js
ApiError.js

// kebab-case for routes and middleware
user-routes.js
auth-middleware.js
```

### Code Documentation

#### Function Documentation
```javascript
/**
 * Register a new user with email verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 * @throws {ApiError} When validation fails or user already exists
 */
const registerUser = AsyncHandler(async (req, res, next) => {
  // Implementation
});
```

#### Model Documentation
```javascript
/**
 * User model schema
 * @typedef {Object} User
 * @property {string} name - User's full name
 * @property {string} email - User's email address (unique)
 * @property {string} password - Hashed password
 * @property {string} role - User role: client, provider, or inspector
 * @property {string} avatar - Cloudinary URL for profile picture
 * @property {boolean} isEmailVerified - Email verification status
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
```

---

## Database Design

### Schema Design Principles

#### User Schema
```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxLength: [50, "Name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Invalid email format"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: [6, "Password must be at least 6 characters"],
    select: false // Don't include in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ["client", "provider", "inspector"],
      message: "Role must be either client, provider, or inspector"
    },
    required: [true, "Role is required"]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

#### Relationship Design
```javascript
// One-to-One: User to ClientProfile
const clientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  companyName: String,
  industry: String
});

// One-to-Many: User to JobRequests
const jobRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: String,
  description: String
});

// Many-to-Many: JobRequest to Services
const jobRequestSchema = new mongoose.Schema({
  requiredServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service"
  }]
});
```

### Indexing Strategy
```javascript
// Compound indexes for common queries
userSchema.index({ email: 1, role: 1 });
jobRequestSchema.index({ clientId: 1, status: 1, createdAt: -1 });

// Text search index
jobRequestSchema.index({
  title: "text",
  description: "text"
});

// Geospatial index (if location-based features)
serviceProviderSchema.index({ location: "2dsphere" });
```

---

## API Development

### Controller Structure
```javascript
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createJobRequest = AsyncHandler(async (req, res) => {
  // 1. Extract and validate input
  const { title, description, estimatedTotal } = req.body;
  
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }
  
  // 2. Business logic
  const jobRequest = await JobRequest.create({
    ...req.body,
    clientId: req.user._id
  });
  
  // 3. Send response
  return res.status(201).json(
    new ApiResponse(201, jobRequest, "Job request created successfully")
  );
});
```

### Route Organization
```javascript
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateJobRequest } from "../middlewares/validation.middleware.js";
import { createJobRequest, getJobRequests } from "../controllers/JobRequest.controller.js";

const router = Router();

// Apply common middleware
router.use(verifyJWT);

// Route definitions
router
  .route("/")
  .get(getJobRequests)
  .post(validateJobRequest, createJobRequest);

router
  .route("/:id")
  .get(getJobRequestById)
  .patch(updateJobRequest)
  .delete(deleteJobRequest);

export default router;
```

### Input Validation
```javascript
// Using custom validation middleware
export const validateJobRequest = (req, res, next) => {
  const { title, description, estimatedTotal } = req.body;
  
  const errors = [];
  
  if (!title || title.trim().length === 0) {
    errors.push("Title is required");
  }
  
  if (estimatedTotal && (typeof estimatedTotal !== 'number' || estimatedTotal < 0)) {
    errors.push("Estimated total must be a positive number");
  }
  
  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  
  next();
};

// Using Joi (alternative approach)
import Joi from 'joi';

const jobRequestSchema = Joi.object({
  title: Joi.string().required().max(100),
  description: Joi.string().required().max(1000),
  estimatedTotal: Joi.number().positive(),
  urgencyLevel: Joi.string().valid('low', 'medium', 'high')
});

export const validateWithJoi = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }
    next();
  };
};
```

---

## Authentication & Authorization

### JWT Implementation
```javascript
// Token generation
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { _id: userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { _id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
  
  return { accessToken, refreshToken };
};

// Token verification middleware
export const verifyJWT = AsyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || 
                req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    throw new ApiError(401, "Access token required");
  }
  
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id).select("-password");
    
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid access token");
  }
});
```

### Role-Based Access Control
```javascript
// Role checking middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Required roles: ${roles.join(', ')}`);
    }
    
    next();
  };
};

// Usage in routes
router.post("/admin-only", verifyJWT, requireRole("admin"), adminOnlyController);
router.post("/provider-or-inspector", verifyJWT, requireRole("provider", "inspector"), controller);
```

### Permission-Based Access
```javascript
// Resource ownership check
export const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
  return AsyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    const resource = await resourceModel.findById(resourceId);
    
    if (!resource) {
      throw new ApiError(404, "Resource not found");
    }
    
    // Check if user owns the resource
    const userIdField = resource.userId || resource.clientId || resource.providerId;
    
    if (userIdField.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Access denied. You can only access your own resources");
    }
    
    req.resource = resource;
    next();
  });
};
```

---

## File Handling

### Multer Configuration
```javascript
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/temp');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'image': ['image/jpeg', 'image/png', 'image/gif'],
    'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  
  const fileCategory = req.route.path.includes('avatar') ? 'image' : 'document';
  
  if (allowedTypes[fileCategory].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only ${fileCategory} files are allowed`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
```

### Cloudinary Integration
```javascript
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (localFilePath, folder = 'ndt-connect') => {
  try {
    if (!localFilePath) return null;
    
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: folder,
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    // Delete local file after upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    return result;
  } catch (error) {
    // Ensure local file is deleted even if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
};

export const destroyImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};
```

---

## Error Handling

### Custom Error Classes
```javascript
// ApiError.js
export class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

### Global Error Handler
```javascript
// Error handling middleware (in app.js)
app.use((err, req, res, next) => {
  let error = err;
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ApiError(400, "Validation Error", message);
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    error = new ApiError(400, message);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, "Invalid JWT token");
  }
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ApiError(400, "File size too large");
  }
  
  console.error("🚨 Error:", {
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});
```

### AsyncHandler Wrapper
```javascript
// AsyncHandler.js
export const AsyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

// Usage
export const getUser = AsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  res.json(new ApiResponse(200, user, "User retrieved successfully"));
});
```

---

## Testing

### Unit Testing with Jest
```javascript
// __tests__/utils/AsyncHandler.test.js
import { AsyncHandler } from '../../src/utils/AsyncHandler.js';

describe('AsyncHandler', () => {
  it('should handle successful async operations', async () => {
    const mockReq = {};
    const mockRes = { json: jest.fn() };
    const mockNext = jest.fn();
    
    const handler = AsyncHandler(async (req, res) => {
      res.json({ success: true });
    });
    
    await handler(mockReq, mockRes, mockNext);
    
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  it('should pass errors to next middleware', async () => {
    const mockError = new Error('Test error');
    const mockNext = jest.fn();
    
    const handler = AsyncHandler(async () => {
      throw mockError;
    });
    
    await handler({}, {}, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });
});
```

### Integration Testing
```javascript
// __tests__/routes/user.test.js
import request from 'supertest';
import { app } from '../../src/app.js';
import { User } from '../../src/models/User.model.js';

describe('User Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({}); // Clean database
  });
  
  describe('POST /api/v1/users/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'client',
        acceptedTerms: true,
        location: 'Test City',
        currency: 'USD'
      };
      
      const response = await request(app)
        .post('/api/v1/users/register')
        .field('name', userData.name)
        .field('email', userData.email)
        .field('password', userData.password)
        .field('role', userData.role)
        .field('acceptedTerms', userData.acceptedTerms)
        .field('location', userData.location)
        .field('currency', userData.currency)
        .attach('avatar', 'test/fixtures/test-avatar.jpg');
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });
  });
});
```

### API Testing with Postman/Newman
```json
{
  "info": {
    "name": "NDT Connect API Tests"
  },
  "item": [
    {
      "name": "User Registration",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/v1/users/register",
        "body": {
          "mode": "formdata",
          "formdata": [
            { "key": "name", "value": "Test User" },
            { "key": "email", "value": "test@example.com" },
            { "key": "password", "value": "password123" }
          ]
        }
      },
      "test": "pm.test('Registration successful', () => { pm.response.to.have.status(201); });"
    }
  ]
}
```

---

## Contributing

### Git Workflow

#### Branch Naming
```
feature/user-authentication
bugfix/payment-validation-error
hotfix/security-vulnerability
refactor/database-optimization
```

#### Commit Messages
```
feat: add user registration with email verification
fix: resolve JWT token expiration issue
docs: update API documentation
refactor: optimize database queries
test: add unit tests for payment controller
```

#### Pull Request Process
1. Create feature branch from `develop`
2. Write code following established patterns
3. Add/update tests
4. Update documentation
5. Submit pull request with clear description
6. Address code review feedback
7. Merge after approval

### Code Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error scenarios covered
- [ ] Input validation implemented

#### Code Quality
- [ ] Follows project coding standards
- [ ] DRY principle followed
- [ ] Functions are small and focused
- [ ] Meaningful variable/function names

#### Security
- [ ] No sensitive data exposed
- [ ] Input sanitization implemented
- [ ] Authentication/authorization checks
- [ ] SQL injection prevention

#### Performance
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Efficient algorithms used
- [ ] Proper caching implemented

#### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Test coverage adequate
- [ ] Manual testing completed

### Development Best Practices

#### Before Starting Development
1. Pull latest changes from develop branch
2. Create feature branch
3. Review requirements and acceptance criteria
4. Plan implementation approach

#### During Development
1. Write tests first (TDD approach recommended)
2. Commit frequently with meaningful messages
3. Keep functions small and focused
4. Document complex logic
5. Follow established patterns

#### Before Submitting PR
1. Run all tests locally
2. Check code coverage
3. Review your own code
4. Update documentation
5. Test manually in development environment

---

## Additional Resources

### Useful Libraries
- **Validation**: Joi, express-validator
- **Testing**: Jest, Supertest, MongoDB Memory Server
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston, Morgan
- **Security**: Helmet, express-rate-limit
- **Utilities**: Lodash, Moment.js/Day.js

### External Documentation
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [Cloudinary API Reference](https://cloudinary.com/documentation)
- [Stripe API Documentation](https://stripe.com/docs/api)

### Tools and Extensions
- **API Testing**: Postman, Insomnia
- **Database GUI**: MongoDB Compass, Robo 3T
- **Code Quality**: ESLint, Prettier, SonarQube
- **Performance**: New Relic, Datadog

---

For questions or clarifications about development practices, please reach out to the development team or create an issue in the repository.
