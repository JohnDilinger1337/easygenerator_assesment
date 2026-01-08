# Authentication Frontend

This is the service-level README for the frontend. Refer to the root [`README.md`](../README.md) for project-wide information, architecture details.

## Quickstart

Prerequisites:

- Node.js 18+
- npm or yarn
- Backend API running (see [`../README.md`](../README.md))

Install and run:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app will be available at `http://localhost:5173`

## Environment Variables

### Required

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Authentication App
```

## Running

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Linting
npm run lint
npm run lint:fix
```

## Authentication Features

- **Cookie Mode** (default)

  - Tokens stored as HttpOnly cookies (backend sets them)
  - Browser automatically includes cookies in requests
  - No manual token management needed
  - XSS-proof authentication

### Token Management

**Auto-Refresh Flow**:

1. Request made with access token
2. Token expired (401 response)
3. API interceptor calls `POST /auth/refresh`
4. New token pair stored in cookie
5. Original request retried with new token

## Pages

### Home Page

- Overview and feature highlights
- Conditional navigation (login vs dashboard buttons)

### Login Page

- Email and password fields
- Form validation with Zod
- Error handling with toast notifications
- Redirect to dashboard on success

### Register Page

- Email, name, and password fields
- Password requirements display
- Email validation
- Error handling with toast notifications
- Link to login page

### Dashboard Page

- Welcome message with user name
- Display logged-in email
- Logout button

## Security Features

- **XSS Protection**: HttpOnly cookies (cookie mode) prevent token theft
- **CSRF Protection**: SameSite=strict on cookies
- **Password Validation**: Minimum 8 chars, complexity requirements
- **Rate Limiting**: Client-side rate limiter for auth endpoints
- **Secure Headers**: Axios configured for CORS requests
- **Input Validation**: Zod schema validation on all forms
- **Error Handling**: Graceful errors, no sensitive data exposed

## API Integration

### Axios Configuration

- Base URL set from `VITE_API_URL`
- CORS credentials enabled (cookies sent automatically)
- Request timeout: 10 seconds
- Automatic token inclusion (token mode)

## Styling

- Tailwind CSS for utility-first styling
- Responsive design (mobile-first)
- Dark mode compatible
- Custom UI components in `components/ui/`

## Type Safety

- Full TypeScript support
- Type definitions for API responses
- Zod schema validation
- React Hook Form integration

## Notes

- The frontend uses cookie for authentication
- In cookie mode, all token management is handled by the browser automatically
- The API interceptor handles token refresh transparently
- See [`../README.md`](../README.md) for project-wide details and CI/CD information

## License

UNLICENSED
