# API Documentation

This document provides comprehensive information about the frontend's API integration and data handling patterns.

## 📋 Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [API Client Configuration](#api-client-configuration)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Caching Strategy](#caching-strategy)
- [Testing APIs](#testing-apis)

## 🌐 API Overview

### Base Configuration

```javascript
// lib/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

### Environment URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000/api/v1` |
| Staging | `https://staging-api.ndtconnect.com/api/v1` |
| Production | `https://api.ndtconnect.com/api/v1` |

## 🔐 Authentication

### Token-Based Authentication

```javascript
// Request interceptor for token injection
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        
        const { access_token } = response.data;
        localStorage.setItem('auth_token', access_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Authentication Endpoints

```javascript
// services/authService.js
export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  async register(userData) {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  async verifyEmail(token) {
    const { data } = await api.post('/auth/verify-email', { token });
    return data;
  },

  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(token, password) {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },

  async refreshToken(refreshToken) {
    const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return data;
  },

  async logout() {
    const { data } = await api.post('/auth/logout');
    return data;
  },
};
```

## ⚙️ API Client Configuration

### Request/Response Interceptors

```javascript
// Request logging and transformation
api.interceptors.request.use(
  (config) => {
    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();
    
    // Add timestamp
    config.metadata = { startTime: Date.now() };
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response logging and error handling
api.interceptors.response.use(
  (response) => {
    // Calculate response time
    const responseTime = Date.now() - response.config.metadata.startTime;
    
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        responseTime: `${responseTime}ms`,
      });
    }
    
    return response;
  },
  (error) => {
    const responseTime = Date.now() - error.config?.metadata?.startTime;
    
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message,
      responseTime: responseTime ? `${responseTime}ms` : 'N/A',
    });
    
    // Handle specific error cases
    handleApiError(error);
    
    return Promise.reject(error);
  }
);
```

### Error Handler

```javascript
// lib/errorHandler.js
import toast from 'react-hot-toast';

export const handleApiError = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message || 'An unexpected error occurred';

  switch (status) {
    case 400:
      toast.error('Invalid request. Please check your input.');
      break;
    case 401:
      toast.error('Please log in to continue.');
      break;
    case 403:
      toast.error('You do not have permission to perform this action.');
      break;
    case 404:
      toast.error('The requested resource was not found.');
      break;
    case 422:
      // Handle validation errors
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        Object.values(errors).flat().forEach(errorMsg => {
          toast.error(errorMsg);
        });
      } else {
        toast.error(message);
      }
      break;
    case 429:
      toast.error('Too many requests. Please try again later.');
      break;
    case 500:
      toast.error('Server error. Please try again later.');
      break;
    default:
      toast.error(message);
  }
};
```

## 📡 Endpoints

### User Management

```javascript
// services/userService.js
export const userService = {
  // Get current user profile
  async getProfile() {
    const { data } = await api.get('/users/profile');
    return data;
  },

  // Update user profile
  async updateProfile(profileData) {
    const { data } = await api.put('/users/profile', profileData);
    return data;
  },

  // Upload profile picture
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const { data } = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Get user by ID (admin only)
  async getUserById(userId) {
    const { data } = await api.get(`/users/${userId}`);
    return data;
  },

  // List users with pagination (admin only)
  async getUsers(params = {}) {
    const { data } = await api.get('/users', { params });
    return data;
  },

  // Delete user (admin only)
  async deleteUser(userId) {
    const { data } = await api.delete(`/users/${userId}`);
    return data;
  },
};
```

### Job Management

```javascript
// services/jobService.js
export const jobService = {
  // Create new job request
  async createJob(jobData) {
    const { data } = await api.post('/jobs', jobData);
    return data;
  },

  // Get jobs for current user
  async getMyJobs(params = {}) {
    const { data } = await api.get('/jobs/my-jobs', { params });
    return data;
  },

  // Get job by ID
  async getJobById(jobId) {
    const { data } = await api.get(`/jobs/${jobId}`);
    return data;
  },

  // Update job status
  async updateJobStatus(jobId, status) {
    const { data } = await api.patch(`/jobs/${jobId}/status`, { status });
    return data;
  },

  // Apply for job (service provider)
  async applyForJob(jobId, applicationData) {
    const { data } = await api.post(`/jobs/${jobId}/apply`, applicationData);
    return data;
  },

  // Accept/reject application (client)
  async handleApplication(jobId, applicationId, action) {
    const { data } = await api.patch(`/jobs/${jobId}/applications/${applicationId}`, { action });
    return data;
  },

  // Submit job completion (service provider)
  async submitCompletion(jobId, completionData) {
    const { data } = await api.post(`/jobs/${jobId}/complete`, completionData);
    return data;
  },

  // Rate and review job (both parties)
  async submitReview(jobId, reviewData) {
    const { data } = await api.post(`/jobs/${jobId}/review`, reviewData);
    return data;
  },
};
```

### Certificate Management

```javascript
// services/certificateService.js
export const certificateService = {
  // Get user's certificates
  async getCertificates() {
    const { data } = await api.get('/certificates');
    return data;
  },

  // Add new certificate
  async addCertificate(certificateData) {
    const formData = new FormData();
    Object.keys(certificateData).forEach(key => {
      formData.append(key, certificateData[key]);
    });

    const { data } = await api.post('/certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Update certificate
  async updateCertificate(certificateId, certificateData) {
    const { data } = await api.put(`/certificates/${certificateId}`, certificateData);
    return data;
  },

  // Delete certificate
  async deleteCertificate(certificateId) {
    const { data } = await api.delete(`/certificates/${certificateId}`);
    return data;
  },

  // Verify certificate (admin)
  async verifyCertificate(certificateId, verificationData) {
    const { data } = await api.patch(`/certificates/${certificateId}/verify`, verificationData);
    return data;
  },
};
```

### Payment Processing

```javascript
// services/paymentService.js
export const paymentService = {
  // Create payment intent
  async createPaymentIntent(amount, currency = 'USD') {
    const { data } = await api.post('/payments/create-intent', { amount, currency });
    return data;
  },

  // Confirm payment
  async confirmPayment(paymentIntentId, paymentMethodId) {
    const { data } = await api.post('/payments/confirm', {
      payment_intent_id: paymentIntentId,
      payment_method_id: paymentMethodId,
    });
    return data;
  },

  // Get payment history
  async getPaymentHistory(params = {}) {
    const { data } = await api.get('/payments/history', { params });
    return data;
  },

  // Process refund (admin)
  async processRefund(paymentId, amount) {
    const { data } = await api.post(`/payments/${paymentId}/refund`, { amount });
    return data;
  },

  // Get earnings summary
  async getEarnings(userId) {
    const { data } = await api.get(`/payments/earnings/${userId}`);
    return data;
  },

  // Request withdrawal
  async requestWithdrawal(withdrawalData) {
    const { data } = await api.post('/payments/withdraw', withdrawalData);
    return data;
  },
};
```

## 📊 Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'client' | 'service_provider' | 'inspector' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
}

interface UserProfile {
  bio?: string;
  location?: Location;
  skills?: Skill[];
  certifications?: Certificate[];
  equipment?: Equipment[];
  rating?: number;
  reviewCount?: number;
}
```

### Job Model

```typescript
interface Job {
  id: string;
  title: string;
  description: string;
  location: Location;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  deadline: string;
  skills: string[];
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  clientId: string;
  serviceProviderId?: string;
  inspectorId?: string;
  createdAt: string;
  updatedAt: string;
  applications: JobApplication[];
  attachments?: FileAttachment[];
}

interface JobApplication {
  id: string;
  jobId: string;
  serviceProviderId: string;
  proposal: string;
  bidAmount: number;
  estimatedDuration: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
```

### Certificate Model

```typescript
interface Certificate {
  id: string;
  userId: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  certificateNumber: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documentUrl?: string;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}
```

## 🚨 Error Handling

### Standard Error Response

```typescript
interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  requestId: string;
  timestamp: string;
}
```

### Error Handling Hook

```javascript
// hooks/useApiError.js
import { useState } from 'react';
import toast from 'react-hot-toast';

export const useApiError = () => {
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleApiCall = async (apiCall) => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      const apiError = error.response?.data;
      
      if (apiError?.errors) {
        setErrors(apiError.errors);
      } else {
        toast.error(apiError?.message || 'An unexpected error occurred');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearErrors = () => setErrors({});

  return { errors, isLoading, handleApiCall, clearErrors };
};
```

## 🚦 Rate Limiting

### Rate Limit Headers

The API returns rate limiting information in response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

### Rate Limit Handler

```javascript
// lib/rateLimitHandler.js
export const handleRateLimit = (error) => {
  if (error.response?.status === 429) {
    const resetTime = error.response.headers['x-ratelimit-reset'];
    const resetDate = new Date(resetTime * 1000);
    const waitTime = Math.ceil((resetDate - new Date()) / 1000);
    
    toast.error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
    
    // Optionally implement retry logic
    return new Promise(resolve => {
      setTimeout(resolve, waitTime * 1000);
    });
  }
};
```

## 💾 Caching Strategy

### React Query Integration

```javascript
// hooks/useApiQuery.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useApiQuery = (key, queryFn, options = {}) => {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries(key);
        });
      }
      
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
```

### Cache Keys

```javascript
// lib/queryKeys.js
export const queryKeys = {
  users: {
    all: ['users'],
    profile: () => [...queryKeys.users.all, 'profile'],
    byId: (id) => [...queryKeys.users.all, 'detail', id],
  },
  jobs: {
    all: ['jobs'],
    my: () => [...queryKeys.jobs.all, 'my'],
    byId: (id) => [...queryKeys.jobs.all, 'detail', id],
    applications: (jobId) => [...queryKeys.jobs.byId(jobId), 'applications'],
  },
  certificates: {
    all: ['certificates'],
    my: () => [...queryKeys.certificates.all, 'my'],
    byId: (id) => [...queryKeys.certificates.all, 'detail', id],
  },
};
```

## 🧪 Testing APIs

### Mock Service Worker Setup

```javascript
// mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    const { email, password } = req.body;
    
    if (email === 'test@example.com' && password === 'password') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            user: { id: '1', email, role: 'client' },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
          },
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Invalid credentials',
      })
    );
  }),

  // User endpoints
  rest.get('/api/v1/users/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'client',
        },
      })
    );
  }),
];
```

### API Testing Utilities

```javascript
// utils/testUtils.js
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

export const renderWithProviders = (ui, options = {}) => {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
```

---

This API documentation provides a comprehensive guide for frontend developers working with the NDT Connect API. For backend API documentation, refer to the backend repository's documentation.
