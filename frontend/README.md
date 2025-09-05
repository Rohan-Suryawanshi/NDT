# NDT Connect - Frontend

<div align="center">
  <img src="./public/Logo.png" alt="NDT Connect Logo" width="200" height="200">
  
  [![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-7.0.3-646CFF.svg)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-38B2AC.svg)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [User Roles](#user-roles)
- [Key Components](#key-components)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Support](#support)

## 🔍 About

**NDT Connect** is a comprehensive platform that bridges the gap between Non-Destructive Testing (NDT) service providers and clients. Our application facilitates seamless connections for specialized NDT services, equipment management, and quality assurance in industrial applications.

### 🎯 Mission
To revolutionize the NDT industry by providing a centralized, user-friendly platform that connects certified professionals with clients who need reliable non-destructive testing services.

## ✨ Features

### 🔧 Core Functionality
- **Multi-Role Dashboard**: Separate dashboards for Clients, Service Providers, Inspectors, and Administrators
- **Service Marketplace**: Browse and request specialized NDT services
- **Real-time Communication**: Integrated messaging and notification system
- **Payment Integration**: Secure payment processing with Stripe
- **Document Management**: Generate and download professional reports
- **3D Interactive Elements**: Immersive user experience with Three.js

### 👥 User Management
- **Authentication System**: Secure login/register with email verification
- **Profile Management**: Comprehensive user profiles with skill matrices
- **Certificate Management**: Upload and manage professional certifications
- **Equipment Tracking**: Manage and showcase NDT equipment inventory

### 📊 Analytics & Reporting
- **Revenue Dashboard**: Financial tracking and analytics
- **Job Management**: Complete job lifecycle management
- **Feedback System**: Comprehensive rating and review system
- **Withdrawal Management**: Secure payment withdrawal system

## 🚀 Tech Stack

### Frontend Framework
- **React 19.1.0** - Modern UI library with latest features
- **React Router DOM 7.6.3** - Client-side routing
- **Vite 7.0.3** - Next-generation frontend tooling

### UI/UX
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI primitives
- **Framer Motion 12.23.3** - Production-ready motion library
- **Lucide React** - Beautiful & consistent icons

### 3D Graphics & Animation
- **Three.js 0.178.0** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for react-three-fiber

### State Management & API
- **Axios 1.10.0** - Promise-based HTTP client
- **React Hot Toast** - Elegant toast notifications

### Payment & Documents
- **Stripe** - Secure payment processing
- **html2pdf.js** - Client-side PDF generation
- **docx** - Generate Word documents
- **file-saver** - Save files on client-side

### Development Tools
- **ESLint** - Code linting and formatting
- **Vite Plugin Compression** - Asset compression
- **Tailwind Animate CSS** - Additional animations

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=your_backend_api_url
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   VITE_APP_NAME="NDT Connect"
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common components (Loader, etc.)
│   └── ui/              # Radix UI styled components
├── features/            # Feature-based components
│   ├── AboutSection/    # Landing page about section
│   ├── CertificateManager/ # Certificate management
│   ├── ContactSection/  # Contact form and info
│   ├── EquipmentManager/ # Equipment inventory
│   ├── FeaturesSection/ # Feature showcase
│   ├── FooterSection/   # Site footer
│   ├── Gemini/         # AI integration
│   ├── HeroSection/    # Landing page hero
│   ├── HowItWorksSection/ # Process explanation
│   ├── InteractiveEarth/ # 3D Earth component
│   ├── JobRequest/     # Job request forms
│   ├── NavbarSection/  # Navigation
│   └── SkillMatrixManager/ # Skills management
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── api.js         # API configuration
│   └── utils.js       # Helper functions
├── pages/              # Page components
│   ├── AdminDashboard.jsx
│   ├── DashbordClient.jsx
│   ├── DashbordProvider.jsx
│   ├── DashbordInspector.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── ... (other pages)
├── constant/           # Application constants
│   ├── agreements.js   # Legal agreements
│   ├── CertificateBody.js # Certificate templates
│   ├── Global.js      # Global constants
│   └── Location.js    # Location data
└── assets/            # Static assets
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |

## 👥 User Roles

### 🏢 Client
- Request NDT services
- Browse service providers
- Manage service requests
- Make payments
- Download reports

### 🔧 Service Provider
- Offer NDT services
- Manage equipment inventory
- Handle job requests
- Withdraw earnings
- Maintain certifications

### 🔍 Inspector
- Conduct inspections
- Provide feedback
- Generate reports
- Manage job assignments
- Process withdrawals

### 👑 Administrator
- Manage all users
- Oversee revenue
- Handle withdrawals
- System settings
- Analytics and reporting

## 🔑 Key Components

### Authentication Flow
- **Register**: Multi-step registration with email verification
- **Login**: Secure authentication with role-based redirects
- **Protected Routes**: Route guards based on user roles

### Dashboard Systems
- **Dynamic Layouts**: Role-specific dashboard interfaces
- **Real-time Updates**: Live data synchronization
- **Interactive Charts**: Data visualization with Recharts

### Payment Integration
- **Stripe Integration**: Secure payment processing
- **Multiple Payment Methods**: Cards, digital wallets
- **Transaction History**: Comprehensive payment tracking

### 3D Interactive Elements
- **Earth Visualization**: Interactive 3D Earth using Three.js
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Optimized for all devices

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

The project includes `vercel.json` configuration for easy deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables for Production

Ensure these environment variables are set in your deployment platform:

```env
VITE_API_URL=https://your-production-api.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_NAME="NDT Connect"
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Code Style Guidelines

- Use **ESLint** configuration provided
- Follow **React best practices**
- Maintain **consistent naming conventions**
- Write **meaningful commit messages**
- Add **comments for complex logic**

## 📞 Support

### Documentation
- [React Documentation](https://reactjs.org/docs)
- [Vite Documentation](https://vitejs.dev/guide)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Getting Help
- 📧 Email: support@ndtconnect.com
- 📱 Phone: +1 (555) 123-4567
- 💬 Discord: [Join our community](https://discord.gg/ndtconnect)

### Bug Reports
Please report bugs through our [GitHub Issues](https://github.com/your-org/ndt-connect/issues) page.

---

<div align="center">
  <p>Made with ❤️ by the NDT Connect Team</p>
  <p>© 2025 NDT Connect. All rights reserved.</p>
</div>