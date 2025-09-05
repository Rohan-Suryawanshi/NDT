# Contributing to NDT Connect

Thank you for considering contributing to NDT Connect! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0+)
- npm (v9.0.0+)
- Git
- Code editor (VS Code recommended)

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/ndt-connect.git
   cd ndt-connect/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔄 Development Process

### Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

Example: `feature/user-authentication`

### Workflow

1. Create a new branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 Coding Standards

### React Components

```jsx
// ✅ Good - Functional component with proper naming
const UserProfile = ({ user, onUpdate }) => {
  // Component logic here
  return (
    <div className="user-profile">
      {/* JSX content */}
    </div>
  );
};

export default UserProfile;
```

### File Naming

- **Components**: PascalCase (`UserProfile.jsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.jsx`)
- **Utilities**: camelCase (`formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.js`)

### CSS Classes

Use Tailwind CSS utility classes:
```jsx
// ✅ Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// ❌ Avoid custom CSS when Tailwind alternatives exist
<div className="custom-header-style">
```

### Import Order

```jsx
// 1. React and React-related imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import axios from 'axios';
import { motion } from 'framer-motion';

// 3. Internal components
import Button from '@/components/ui/button';
import UserCard from '@/components/UserCard';

// 4. Internal utilities and constants
import { formatDate } from '@/lib/utils';
import { API_ENDPOINTS } from '@/constant/Global';
```

## 📨 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add email verification functionality

- Implement email verification service
- Add verification status to user model
- Create verification email template

Closes #123
```

```bash
fix(dashboard): resolve chart rendering issue

The revenue chart was not displaying correctly on mobile devices
due to incorrect responsive breakpoints.

Fixes #456
```

## 🔍 Pull Request Process

### Before Submitting

1. **Run tests and linting**
   ```bash
   npm run lint
   npm run build
   ```

2. **Update documentation if needed**

3. **Test your changes thoroughly**
   - Manual testing
   - Cross-browser compatibility
   - Mobile responsiveness

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Cross-browser testing
- [ ] Mobile testing

## Screenshots
(If applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No merge conflicts
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on staging environment
4. **Approval** and merge

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Environment details** (OS, browser, version)
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots/videos** if applicable
- **Console errors** if any

### Feature Requests

Include:

- **Use case description**
- **Proposed solution**
- **Alternative solutions considered**
- **Additional context**

### Security Issues

For security vulnerabilities, please email security@ndtconnect.com instead of creating a public issue.

## 🏷️ Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `documentation` | Improvements to documentation |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `priority: high` | High priority issue |
| `priority: low` | Low priority issue |

## 📚 Resources

### Learning Resources

- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)

### Tools

- [VS Code Extensions](DEVELOPMENT.md#recommended-extensions)
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 🙏 Recognition

Contributors will be recognized in our [CONTRIBUTORS.md](CONTRIBUTORS.md) file and in release notes.

---

Thank you for contributing to NDT Connect! 🚀
