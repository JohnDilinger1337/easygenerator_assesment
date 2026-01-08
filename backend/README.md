# Authentication Service (backend)

This is the service-level README for the backend. Refer to the root [`README.md`](../README.md) for project-wide information, architecture details.

## Quickstart

Prerequisites:

- Node.js 18+
- MongoDB 4.4+
- npm or yarn

Start MongoDB:

- Make sure MongoDB is running on your system. If using Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

Install and run locally:

```bash
git clone <repo-url>
cd backend
npm install
cp .env.example .env
npm run start:dev
```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/api`

## Environment Variables

### Required

```env
DB_HOST=localhost
DB_PORT=27017
DB_DATABASE=easygenerator
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
AUTH_MODE=cookie  # or 'body' for token mode
THROTTLE_LOGIN_LIMIT=5
THROTTLE_LOGIN_TTL=60
```

## Running

```bash
# Development with auto-reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Tests
npm run test

# Type checking
npx tsc --noEmit
```

## Authentication Details

### Dual Mode Support

- **Cookie Mode** (default): Tokens stored as HttpOnly cookies
  - Frontend doesn't need to manage tokens
  - Browser sends cookies automatically
  - XSS-proof and CSRF-protected

- **Token Mode**: Tokens returned in response body
  - Frontend stores tokens in localStorage
  - Must include Authorization header for requests
  - Suitable for mobile apps and cross-origin requests

### Token Lifecycle

1. User logs in → receives access token (15m) + refresh token (7d)
2. Access token expires → API interceptor calls /auth/refresh
3. New token pair generated and stored
4. Original request retried with new token
5. Refresh token expires → user must log in again

### Security Features

- Passwords hashed with Argon2id (secure parameters)
- Tokens signed with HS256 algorithm
- Refresh tokens hashed in database (SHA256)
- Automatic refresh token rotation
- Rate limiting: 5 requests/min for auth endpoints
- Graceful error handling (no stack trace leakage)
- Input validation with class-validator
- CORS and Helmet for security headers

## Notes

- The project uses NestJS with TypeScript for type safety
- MongoDB is the primary database with Mongoose ODM
- All endpoints support both authentication modes

## License

UNLICENSED
