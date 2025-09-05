# Security Policy

## 🔒 Security Guidelines

This document outlines the security measures and policies implemented in the NDT Connect frontend application.

## 📋 Table of Contents

- [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)
- [Security Measures](#security-measures)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [Input Validation](#input-validation)
- [Dependencies Security](#dependencies-security)
- [Best Practices](#best-practices)
- [Security Checklist](#security-checklist)

## 🚨 Reporting Security Vulnerabilities

### How to Report

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue
2. Email us at: **security@ndtconnect.com**
3. Include detailed information about the vulnerability
4. Allow us 90 days to address the issue before public disclosure

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested remediation (if any)
- Your contact information

### Response Timeline

- **24 hours**: Initial response acknowledging receipt
- **72 hours**: Preliminary assessment
- **30 days**: Resolution or mitigation plan
- **90 days**: Full resolution (in most cases)

## 🛡️ Security Measures

### Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.ndtconnect.com https://api.stripe.com;
  frame-src https://js.stripe.com;
">
```

### HTTPS Enforcement

- All production traffic uses HTTPS
- HSTS headers implemented
- Secure cookie flags set
- Mixed content prevention

### Cross-Origin Resource Sharing (CORS)

```javascript
// API requests only to authorized domains
const allowedOrigins = [
  'https://api.ndtconnect.com',
  'https://staging-api.ndtconnect.com'
];
```

## 🔐 Authentication & Authorization

### Token Management

```javascript
// Secure token storage
class TokenManager {
  static setToken(token) {
    // Store in httpOnly cookie (preferred) or secure localStorage
    if (this.isSecureContext()) {
      document.cookie = `auth_token=${token}; Secure; HttpOnly; SameSite=Strict`;
    } else {
      localStorage.setItem('auth_token', token);
    }
  }

  static getToken() {
    // Retrieve token securely
    const token = localStorage.getItem('auth_token');
    return this.validateToken(token) ? token : null;
  }

  static removeToken() {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  static validateToken(token) {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  static isSecureContext() {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  }
}
```

### Route Protection

```javascript
// Protected route implementation with role-based access
const ProtectedRoute = ({ children, requiredRole, requiredPermissions = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission-based access control
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.every(permission =>
      user.permissions?.includes(permission)
    );
    
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};
```

### Session Management

```javascript
// Automatic logout on token expiration
class SessionManager {
  static initializeSession() {
    this.checkTokenExpiration();
    this.setupInactivityTimer();
    this.setupVisibilityCheck();
  }

  static checkTokenExpiration() {
    const token = TokenManager.getToken();
    if (token && !TokenManager.validateToken(token)) {
      this.logout('Token expired');
    }
  }

  static setupInactivityTimer() {
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.logout('Session timeout due to inactivity');
      }, INACTIVITY_TIMEOUT);
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();
  }

  static logout(reason) {
    console.log('Logout reason:', reason);
    TokenManager.removeToken();
    window.location.href = '/login';
  }
}
```

## 🔒 Data Protection

### Sensitive Data Handling

```javascript
// Sanitize sensitive data before logging
const sanitizeForLogging = (data) => {
  const sensitiveFields = ['password', 'token', 'ssn', 'creditCard', 'email'];
  
  return Object.keys(data).reduce((sanitized, key) => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = data[key];
    }
    return sanitized;
  }, {});
};

// API request interceptor for logging
api.interceptors.request.use(config => {
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    data: sanitizeForLogging(config.data || {})
  });
  return config;
});
```

### Local Storage Security

```javascript
// Encrypted local storage wrapper
class SecureStorage {
  static encrypt(data) {
    // In a real implementation, use a proper encryption library
    return btoa(JSON.stringify(data));
  }

  static decrypt(encryptedData) {
    try {
      return JSON.parse(atob(encryptedData));
    } catch {
      return null;
    }
  }

  static setItem(key, value) {
    const encrypted = this.encrypt(value);
    localStorage.setItem(key, encrypted);
  }

  static getItem(key) {
    const encrypted = localStorage.getItem(key);
    return encrypted ? this.decrypt(encrypted) : null;
  }

  static removeItem(key) {
    localStorage.removeItem(key);
  }
}
```

## ✅ Input Validation

### Form Validation

```javascript
// Comprehensive input validation
import DOMPurify from 'dompurify';

class InputValidator {
  static sanitizeHtml(input) {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validatePhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS vectors
      .substring(0, 1000); // Limit input length
  }
}

// Usage in forms
const ContactForm = () => {
  const validateForm = (data) => {
    const errors = {};

    if (!InputValidator.validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!InputValidator.validatePassword(data.password)) {
      errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    // Sanitize all string inputs
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = InputValidator.sanitizeInput(data[key]);
      }
    });

    return { errors, sanitizedData: data };
  };
};
```

### XSS Prevention

```javascript
// Escape HTML to prevent XSS
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Safe HTML rendering component
const SafeHtml = ({ content, allowedTags = [] }) => {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};
```

## 📦 Dependencies Security

### Package Audit

```bash
# Regular security audits
npm audit
npm audit fix

# Check for known vulnerabilities
npm install --package-lock-only
npm audit
```

### Dependency Management

```json
{
  "scripts": {
    "security-check": "npm audit && npm run check-updates",
    "check-updates": "npx npm-check-updates",
    "update-deps": "npx npm-check-updates -u && npm install"
  }
}
```

### Automated Security Scanning

```yaml
# GitHub Actions security scan
- name: Run security audit
  run: npm audit --audit-level high

- name: Check for known vulnerabilities
  uses: securecodewarrior/github-action-add-sarif@v1
  with:
    sarif-file: 'security-scan-results.sarif'
```

## 🔧 Best Practices

### Secure Coding Guidelines

1. **Input Validation**
   - Validate all user inputs
   - Sanitize data before processing
   - Use parameterized queries for API calls

2. **Output Encoding**
   - Escape HTML content
   - Use safe innerHTML alternatives
   - Validate data before rendering

3. **Error Handling**
   - Don't expose sensitive information in errors
   - Log security events
   - Implement proper error boundaries

4. **API Security**
   - Use HTTPS for all API calls
   - Implement request rate limiting
   - Validate API responses

### Environment Security

```javascript
// Environment-specific security configurations
const securityConfig = {
  development: {
    enableDebug: true,
    strictCSP: false,
    allowHttp: true
  },
  staging: {
    enableDebug: true,
    strictCSP: true,
    allowHttp: false
  },
  production: {
    enableDebug: false,
    strictCSP: true,
    allowHttp: false,
    enableHSTS: true
  }
};

const config = securityConfig[import.meta.env.MODE] || securityConfig.production;
```

## ✅ Security Checklist

### Pre-deployment Security Checklist

- [ ] **Authentication**
  - [ ] Secure token storage implemented
  - [ ] Session timeout configured
  - [ ] Logout functionality working
  - [ ] Password requirements enforced

- [ ] **Authorization**
  - [ ] Role-based access control implemented
  - [ ] Protected routes secured
  - [ ] Permission checks in place

- [ ] **Input Validation**
  - [ ] All user inputs validated
  - [ ] XSS prevention measures
  - [ ] SQL injection prevention
  - [ ] File upload validation

- [ ] **Data Protection**
  - [ ] Sensitive data encrypted
  - [ ] Secure transmission (HTTPS)
  - [ ] Data sanitization implemented
  - [ ] PII handling compliant

- [ ] **Dependencies**
  - [ ] Security audit passed
  - [ ] No known vulnerabilities
  - [ ] Dependencies up to date
  - [ ] License compliance verified

- [ ] **Configuration**
  - [ ] Environment variables secured
  - [ ] Debug mode disabled in production
  - [ ] Error messages sanitized
  - [ ] Security headers configured

- [ ] **Monitoring**
  - [ ] Security logging enabled
  - [ ] Error tracking configured
  - [ ] Anomaly detection set up
  - [ ] Incident response plan ready

### Monthly Security Review

- [ ] Review access logs
- [ ] Update dependencies
- [ ] Check for new vulnerabilities
- [ ] Review user permissions
- [ ] Update security documentation
- [ ] Conduct penetration testing
- [ ] Review incident reports
- [ ] Update security policies

## 📞 Security Contacts

- **Security Team**: security@ndtconnect.com
- **Emergency Contact**: +1 (555) 123-4567
- **Bug Bounty Program**: [Coming Soon]

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

For security updates and patches, always use the latest version of the application.

---

Last updated: January 2025
