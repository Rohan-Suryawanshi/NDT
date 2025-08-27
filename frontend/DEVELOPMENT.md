# Development Guide

This guide provides detailed information for developers working on the NDT Connect frontend application.

## 📋 Table of Contents

- [Development Environment](#development-environment)
- [Architecture Overview](#architecture-overview)
- [Recommended Extensions](#recommended-extensions)
- [Code Organization](#code-organization)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Testing Strategy](#testing-strategy)
- [Performance Optimization](#performance-optimization)
- [Debugging](#debugging)
- [Common Patterns](#common-patterns)

## 🛠️ Development Environment

### Recommended VS Code Extensions

Essential extensions for optimal development experience:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "html": "HTML"
  },
  "tailwindCSS.experimental.classRegex": [
    "tw`([^`]*)",
    "tw=\"([^\"]*)",
    "tw={\"([^\"}]*)",
    "tw\\.\\w+`([^`]*)",
    "tw\\(.*?\\)`([^`]*)"
  ]
}
```

## 🏗️ Architecture Overview

### Component Architecture

```
Components
├── UI Components (Radix UI based)
│   ├── Primitive components (Button, Input, etc.)
│   └── Composed components (Forms, Modals, etc.)
├── Feature Components
│   ├── Business logic components
│   └── Page-specific components
└── Layout Components
    ├── Navigation
    ├── Sidebars
    └── Footers
```

### Folder Structure Explained

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   └── common/          # Shared components
├── features/            # Feature-based organization
│   └── [FeatureName]/   # Each feature in its own folder
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configs
├── pages/               # Route components
├── constant/            # Application constants
└── assets/              # Static files
```

## 🔧 Code Organization

### Feature-Based Structure

Each feature follows this pattern:

```
features/CertificateManager/
├── CertificateManager.jsx    # Main component
├── CertificateForm.jsx       # Sub-components
├── CertificateList.jsx
├── hooks/
│   └── useCertificates.jsx   # Feature-specific hooks
├── components/
│   └── CertificateCard.jsx   # Feature-specific components
└── utils/
    └── certificateUtils.js   # Feature utilities
```

### Component Patterns

#### 1. Functional Components with Hooks

```jsx
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Loader />;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      {/* Component content */}
    </div>
  );
};

export default UserProfile;
```

#### 2. Custom Hooks

```jsx
// hooks/useAuth.jsx
import { useState, useEffect } from 'react';
import { getAuthToken, removeAuthToken } from '@/lib/utils';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Verify token and get user
      verifyToken(token).then(setUser);
    }
    setLoading(false);
  }, []);

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return { user, loading, logout };
};
```

#### 3. Protected Routes

```jsx
// ProtectedRoute.jsx
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

## 🗄️ State Management

### Local State vs Global State

- **Local State**: Component-specific data (form inputs, UI toggles)
- **Global State**: App-wide data (user auth, settings)

### Context Pattern

```jsx
// contexts/AuthContext.jsx
import React, { createContext, useContext, useReducer } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
  });

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 🌐 API Integration

### API Client Setup

```javascript
// lib/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export default api;
```

### API Service Pattern

```javascript
// services/userService.js
import api from '@/lib/api';

export const userService = {
  async getProfile() {
    const { data } = await api.get('/user/profile');
    return data;
  },

  async updateProfile(userData) {
    const { data } = await api.put('/user/profile', userData);
    return data;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
```

## 🧪 Testing Strategy

### Unit Testing with Vitest

```javascript
// __tests__/components/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

### Integration Testing

```javascript
// __tests__/features/auth.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import { AuthProvider } from '@/contexts/AuthContext';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow', () => {
  it('logs in user successfully', async () => {
    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByText(/sign in/i));
    
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
```

## ⚡ Performance Optimization

### Code Splitting

```jsx
// Lazy loading components
import { lazy, Suspense } from 'react';
import Loader from '@/components/common/Loader';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<Loader />}>
              <Dashboard />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
};
```

### React.memo for Performance

```jsx
import React, { memo } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  // Expensive computations here
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveCalculation(item),
    }));
  }, [data]);

  return (
    <div>
      {processedData.map(item => (
        <ItemCard key={item.id} item={item} onUpdate={onUpdate} />
      ))}
    </div>
  );
});
```

### Bundle Analysis

```bash
# Analyze bundle size
npm install --save-dev vite-bundle-analyzer
npm run build -- --analyze
```

## 🐛 Debugging

### React Developer Tools

1. Install React DevTools browser extension
2. Use Component and Profiler tabs
3. Monitor component renders and props

### Console Debugging

```javascript
// Debug hooks
import { useDebugValue } from 'react';

const useCustomHook = (value) => {
  useDebugValue(value > 0 ? 'Positive' : 'Zero or Negative');
  // Hook logic...
};

// Debug API calls
const debugAPI = (config) => {
  console.group('API Request');
  console.log('URL:', config.url);
  console.log('Method:', config.method);
  console.log('Data:', config.data);
  console.groupEnd();
  return config;
};

api.interceptors.request.use(debugAPI);
```

### Error Boundaries

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🎨 Common Patterns

### Form Handling

```jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const ContactForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await submitForm(data);
      reset();
      toast.success('Form submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit form');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^\S+@\S+$/i,
              message: 'Invalid email address',
            },
          })}
          className="input"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### Modal Pattern

```jsx
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};
```

### Data Fetching Pattern

```jsx
import { useState, useEffect } from 'react';

const useApiData = (url, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(url);
        
        if (!cancelled) {
          setData(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error, refetch: () => fetchData() };
};
```

---

This development guide should help you understand the codebase structure and implement features following our established patterns. For specific questions, please refer to the main README or reach out to the development team.
