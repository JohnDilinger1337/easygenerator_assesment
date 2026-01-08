# EasyGenerator Assessment - Full Stack Authentication Application

A production-ready authentication application built with NestJS (backend) and React (frontend), featuring comprehensive security, dual-mode authentication, logging, rate limiting, and optimized code architecture.

## 🚀 Features

### Backend

- ✅ User registration and authentication
- ✅ JWT access tokens with refresh token rotation
- ✅ Dual authentication modes: HttpOnly cookies (XSS protection) and Bearer tokens
- ✅ Password hashing with Argon2id (secure parameters)
- ✅ Rate limiting (auth: 5/min, general: 100/min, refresh: 10/min)
- ✅ Comprehensive logging system with request/response tracking
- ✅ API documentation with Swagger
- ✅ Security best practices (Helmet, CORS, input validation, HTTPS)
- ✅ MongoDB integration with Mongoose
- ✅ Graceful error handling without exposing stack traces
- ✅ Proper token expiration date calculations

### Frontend

- ✅ React 18 with TypeScript
- ✅ Modern UI with Tailwind CSS and responsive design
- ✅ Form validation with Zod
- ✅ Client-side rate limiting
- ✅ Cookie based authentication
- ✅ Automatic token refresh via API interceptors
- ✅ Proper auth state synchronization

### DevOps

- ✅ GitHub Actions unified CI workflow
- ✅ Code linting with ESLint
- ✅ TypeScript compilation verification
- ✅ CD intentionally postponed (infrastructure-ready)

## 📋 Prerequisites

- Node.js 18+
- MongoDB 4.4+
- npm or yarn

## 🏗️ System Design

### Dual Authentication Modes

The system supports two authentication modes:

1. **Cookie Mode** (Recommended for Web Apps)

   - Both access and refresh tokens stored as HttpOnly cookies
   - Browser automatically includes cookies in requests
   - XSS-proof (tokens cannot be accessed by JavaScript)
   - Better CSRF protection with SameSite=strict

2. **Token Mode** (For SPAs and APIs)
   - Access token returned in response body
   - Tokens stored in localStorage
   - Manual token management via Bearer header
   - Auto-refresh via API interceptors

Both modes support automatic token refresh with concurrent request handling.

## 📚 Documentation

See [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) for system architecture and diagrams.

## Quick Start

### Database

- If using Docker (if not then grab your connection link from the source):

```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your MongoDB and JWT settings
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Configure VITE_API_URL to match backend (default: http://localhost:3000)
npm run dev
```

## License

UNLICENSED
