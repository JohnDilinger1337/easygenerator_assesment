# Authentication Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐        ┌──────────────────┐                 │
│  │  AuthContext     │        │  useAuth Hook    │                 │
│  │  - user state    │──────→ │  - login()       │                 │
│  │  - auth mode     │        │  - logout()      │                 │
│  │  - isLoading     │        │  - register()    │                 │
│  └──────────────────┘        └──────────────────┘                 │
│           │                           │                            │
│           ▼                           ▼                            │
│  ┌──────────────────────────────────────────┐                     │
│  │       AuthService                        │                     │
│  │  - login()  - register()  - logout()     │                     │
│  │  - getCurrentUser()                      │                     │
│  │  - refreshToken()                        │                     │
│  └──────────────────────────────────────────┘                     │
│           │                                                        │
│           ▼                                                        │
│  ┌──────────────────────────────────────────┐                     │
│  │    API Client (axios)                    │                     │
│  │  ┌──────────────────────────────────┐    │                     │
│  │  │ Request Interceptor              │    │                     │
│  │  │ - Include cookies automatically  │    │                     │
│  │  │ - withCredentials: true          │    │                     │
│  │  └──────────────────────────────────┘    │                     │
│  │  ┌──────────────────────────────────┐    │                     │
│  │  │ Response Interceptor             │    │                     │
│  │  │ - Handle 401 errors              │    │                     │
│  │  │ - Call refresh endpoint          │    │                     │
│  │  │ - Retry failed requests          │    │                     │
│  │  └──────────────────────────────────┘    │                     │
│  └──────────────────────────────────────────┘                     │
│                                                                     │
│  Note: All authentication uses HttpOnly cookies                    │
│  No tokens stored in frontend memory or storage                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (with cookies)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────┐                     │
│  │  AuthController                          │                     │
│  │  POST /auth/register                     │                     │
│  │  POST /auth/login                        │                     │
│  │  POST /auth/refresh                      │                     │
│  │  POST /auth/logout                       │                     │
│  │  GET  /auth/me                           │                     │
│  └──────────────────────────────────────────┘                     │
│           │                                                        │
│           ▼                                                        │
│  ┌──────────────────────────────────────────┐                     │
│  │  AuthService                             │                     │
│  │  - register()  - login()  - logout()     │                     │
│  │  - refreshToken()                        │                     │
│  │  - generateTokens() [PRIVATE]            │                     │
│  │  - validateRefreshToken()                │                     │
│  │  - hashToken() [SHA256]                  │                     │
│  │  - cleanupExpiredTokens()                │                     │
│  └──────────────────────────────────────────┘                     │
│           │                    │                                   │
│           ▼                    ▼                                   │
│  ┌────────────────┐   ┌────────────────┐                          │
│  │  JwtService    │   │ PasswordService│                          │
│  │  - sign()      │   │ - hash()       │                          │
│  │  - verify()    │   │ - verify()     │                          │
│  └────────────────┘   └────────────────┘                          │
│           │                                                        │
│           ▼                                                        │
│  ┌──────────────────────────────────────────┐                     │
│  │  MongoDB                                 │                     │
│  │  - User collection                       │                     │
│  │  - RefreshToken collection               │                     │
│  │    (hashed tokens, userId, expiresAt)    │                     │
│  └──────────────────────────────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow (Cookie-Based)

```
USER                           FRONTEND                        BACKEND
 │                                 │                              │
 │─────────── login ──────────────→│                              │
 │                                 │──────── POST /auth/login ───→│
 │                                 │                              │
 │                                 │◄─ 200 OK + Set-Cookie ──────│
 │                                 │  accessToken (httpOnly)      │
 │                                 │  refreshToken (httpOnly)     │
 │                                 │  + user data in body         │
 │◄───────── authenticated ────────│                              │
 │                                 │                              │
 │─────── API request ────────────→│                              │
 │                                 │────────→ (cookies included)  │
 │                                 │                              │
 │                                 │◄─ 200 OK (data) ────────────│
 │◄───────── data ─────────────────│                              │
 │                                 │                              │
 │                           (Token expires)                      │
 │                                 │                              │
 │─────── API request ────────────→│                              │
 │                                 │────────→ (cookies included)  │
 │                                 │                              │
 │                                 │◄─ 401 Unauthorized ─────────│
 │                                 │                              │
 │                                 │ (Interceptor auto-refresh)   │
 │                                 │──── POST /auth/refresh ─────→│
 │                                 │   (refresh cookie included)  │
 │                                 │                              │
 │                                 │◄─ 200 OK + Set-Cookie ──────│
 │                                 │  (new access & refresh)      │
 │                                 │                              │
 │                                 │────────→ (retry with new)    │
 │                                 │◄─ 200 OK (data) ────────────│
 │◄───────── data ─────────────────│                              │
```

## Error Handling Flow

```
API Request
    │
    └─→ Error Response
        │
        ├─→ Status 401 (Unauthorized)
        │   │
        │   ├─→ Is refresh already in progress?
        │   │   │
        │   │   ├─→ Yes: Queue request, wait for refresh
        │   │   │
        │   │   └─→ No: Start refresh flow
        │   │       │
        │   │       ├─→ Refresh succeeds?
        │   │       │   │
        │   │       │   ├─→ Yes:
        │   │       │   │   ├─→ Backend sets new cookies
        │   │       │   │   ├─→ Retry original request
        │   │       │   │   └─→ Process queued requests
        │   │       │   │
        │   │       │   └─→ No:
        │   │       │       ├─→ Backend clears cookies
        │   │       │       ├─→ Logout user
        │   │       │       └─→ Redirect to /login
        │
        ├─→ Status 400 (Bad Request)
        │   └─→ Show validation error to user
        │
        ├─→ Status 403 (Forbidden)
        │   └─→ Show access denied message
        │
        ├─→ Status 429 (Too Many Requests)
        │   └─→ Show rate limit message
        │
        └─→ Status 5xx (Server Error)
            └─→ Show generic error message
```

## Token Expiration & Refresh

```
BACKEND CONFIGURATION (in seconds):
├─→ JWT_EXPIRES_IN=900           # Access token: 15 minutes
└─→ JWT_REFRESH_EXPIRES_IN=604800 # Refresh token: 7 days

TOKEN LIFECYCLE:
├─→ Login/Register
│   ├─→ Access token issued (expires in 900s)
│   ├─→ Refresh token issued (expires in 604800s)
│   └─→ Both stored as HttpOnly cookies
│
├─→ Token Usage
│   ├─→ Browser automatically includes cookies in requests
│   ├─→ Backend validates access token from cookie
│   └─→ No frontend token management needed
│
├─→ Access Token Expires
│   ├─→ API returns 401
│   ├─→ Interceptor calls /auth/refresh (refresh cookie included)
│   ├─→ Backend sets new cookies
│   └─→ Original request retried
│
└─→ Refresh Token Expires
    ├─→ Refresh attempt fails
    ├─→ Backend clears cookies
    ├─→ User logged out
    └─→ Redirected to login
```

## State Management Flow

```
App Mount
    │
    ├─→ AuthProvider initializes
    │   │
    │   ├─→ checkAuth() calls getCurrentUser()
    │   │   │
    │   │   └─→ Cookies automatically included by browser
    │   │
    │   └─→ Sets user state from response
    │
    └─→ AuthContext provides auth state to app
        │
        ├─→ user: User | null
        ├─→ isAuthenticated: boolean
        ├─→ isLoading: boolean
        └─→ error: string | null

User Login
    │
    ├─→ login(credentials)
    │   │
    │   ├─→ AuthService.login() calls POST /auth/login
    │   │   │
    │   │   ├─→ Backend validates credentials
    │   │   ├─→ Backend sets httpOnly cookies (access + refresh)
    │   │   └─→ Response: { expiresIn: 900 }
    │   │
    │   ├─→ AuthService.getCurrentUser() calls GET /auth/me
    │   │   │
    │   │   └─→ Response: { user }
    │   │
    │   └─→ AuthContext updates state
    │       ├─→ user = response
    │       ├─→ isAuthenticated = true
    │       └─→ UI re-renders
    │
    └─→ Navigate to dashboard

API Request
    │
    ├─→ Component calls apiClient.get()
    │   │
    │   └─→ Request Interceptor
    │       │
    │       └─→ Browser automatically includes cookies
    │           (withCredentials: true)
    │
    └─→ Request sent to backend with cookies

401 Response Handler
    │
    ├─→ Response Interceptor detects 401
    │   │
    │   └─→ If already refreshing: Queue request
    │       │
    │       └─→ Else: Start refresh
    │           │
    │           ├─→ POST /auth/refresh (cookies included)
    │           ├─→ Backend validates refresh cookie
    │           ├─→ Backend sets new cookies
    │           └─→ Retry original request
    │
    └─→ On refresh failure: Logout and redirect

User Logout
    │
    ├─→ logout() called
    │   │
    │   ├─→ AuthService.logout() calls POST /auth/logout
    │   │   │
    │   │   ├─→ Backend revokes refresh token
    │   │   └─→ Backend clears cookies
    │   │
    │   └─→ AuthContext resets state
    │       ├─→ user = null
    │       └─→ isAuthenticated = false
    │
    └─→ Navigate to /login
```
