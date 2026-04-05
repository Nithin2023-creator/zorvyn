# Zorvyn NGO — Fund Management Dashboard

A full-stack fund management dashboard built for NGOs to track donations, expenditures, and team activity. Features role-based access control, real-time analytics, and a clean REST API.

---

## Tech Stack (Backend)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js + TypeScript | Type-safe server-side JavaScript |
| **Framework** | Express v5 | HTTP server and routing |
| **ORM** | Prisma v5 | Database access with type-safe queries |
| **Database** | PostgreSQL | Relational data storage |
| **Authentication** | JWT (jsonwebtoken) | Stateless token-based auth |
| **Password Hashing** | bcrypt (12 rounds) | Secure one-way password hashing |
| **Validation** | Zod v4 | Runtime schema validation for requests & env vars |
| **Rate Limiting** | express-rate-limit | Brute-force protection on auth endpoints |
| **API Docs** | Swagger (swagger-jsdoc + swagger-ui-express) | Auto-generated OpenAPI documentation |
| **Testing** | Vitest + Supertest | Unit and integration testing |
| **Dev Tooling** | tsx (watch mode) | Fast TypeScript execution with hot-reload |

---

## Architecture Overview

```
src/
├── app.ts                    # Express app bootstrap & route mounting
├── config/
│   └── env.ts                # Zod-validated environment configuration
├── controllers/
│   ├── DashboardController   # Dashboard analytics endpoints
│   ├── RecordController      # CRUD for fund records
│   └── UserController        # Auth + user management
├── middlewares/
│   ├── authGuard.ts          # JWT verification + active user check
│   ├── roleGuard.ts          # Variadic role-based access control
│   ├── validateRequest.ts    # Zod schema validation middleware
│   └── errorHandler.ts       # Global error handler + AppError class
├── prisma/
│   ├── schema.prisma         # Data model definitions
│   ├── client.ts             # Singleton PrismaClient instance
│   └── seed.ts               # Conditional NGO data seeding
├── routes/
│   ├── dashboardRoutes.ts    # GET /dashboard/*
│   ├── recordRoutes.ts       # CRUD /records/*
│   └── userRoutes.ts         # Auth + admin user management
├── services/
│   ├── DashboardService      # Aggregation queries + raw SQL trends
│   ├── RecordService         # Business logic with soft-delete
│   └── UserService           # Auth flows + user CRUD
├── swagger/
│   └── swagger.ts            # OpenAPI spec generation
├── types/
│   └── index.ts              # Shared TypeScript interfaces
├── validations/
│   ├── recordValidations.ts  # Zod schemas for records
│   └── userValidations.ts    # Zod schemas for auth & users
└── __tests__/
    ├── auth.test.ts           # Auth validation tests
    ├── records.test.ts        # Records API validation tests
    ├── dashboard.test.ts      # Dashboard aggregation tests
    └── roleGuard.test.ts      # RBAC middleware tests
```

### Layered Design Pattern

The backend follows a strict **Controller → Service → Prisma** layered architecture:

1. **Routes** define HTTP verbs, apply middleware guards, and delegate to controllers
2. **Controllers** parse request params and call service methods (thin layer)
3. **Services** contain all business logic, database queries, and error handling
4. **Middlewares** handle cross-cutting concerns (auth, validation, errors)

---

## Setup & Installation

### Prerequisites

- **Node.js** ≥ 18.x
- **PostgreSQL** ≥ 14.x (running and accessible)
- **npm** ≥ 9.x

### Step-by-Step

```bash
# 1. Clone the repository
git clone <repo-url> && cd Zorvyn

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL connection string and JWT secret
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string (required) |
| `JWT_SECRET` | — | Secret key for signing JWTs (required) |
| `JWT_EXPIRES_IN` | `24h` | Token expiration duration |
| `PORT` | `3000` | Server port |
| `BCRYPT_SALT_ROUNDS` | `12` | bcrypt hashing cost factor |

> All environment variables are validated at startup using Zod. The server will **refuse to start** if required variables are missing or malformed.

### Database Setup

```bash
# Generate the Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed with sample NGO data (manual)
npm run prisma:seed
```

### Running the Server

```bash
# Development (auto-seeds if DB is empty, then starts with hot-reload)
npm run dev

# Production
npm run build
npm start
```

The `predev` hook automatically runs `prisma:seed` before starting the dev server. The seed script is **conditional** — it checks if users already exist and skips seeding if data is present.

---

## API Reference

**Base URL**: `http://localhost:3000/api`
**Swagger UI**: `http://localhost:3000/api-docs`

All protected endpoints require: `Authorization: Bearer <token>`

### Authentication

| Method | Endpoint | Body | Description | Access |
|--------|----------|------|-------------|--------|
| `POST` | `/auth/register` | `{ name, email, password }` | Register new user (VIEWER role) | Public |
| `POST` | `/auth/login` | `{ email, password }` | Login and receive JWT | Public |

**Password rules**: Min 8 chars, at least 1 uppercase letter, at least 1 number.

**Response** (both endpoints):
```json
{
  "success": true,
  "data": {
    "user": { "id", "name", "email", "role", "isActive", "createdAt" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Fund Records (CRUD)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/records` | List records (paginated, filterable) | ALL |
| `GET` | `/records/:id` | Get single record | ALL |
| `POST` | `/records` | Create new record | ADMIN, ANALYST |
| `PUT` | `/records/:id` | Update record | ADMIN, ANALYST |
| `DELETE` | `/records/:id` | Soft-delete record | ADMIN only |

**Query Parameters** for `GET /records`:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Records per page (max 100) |
| `type` | `INCOME` \| `EXPENSE` | — | Filter by record type |
| `category` | string | — | Case-insensitive category search |
| `startDate` | ISO date | — | Filter records from this date |
| `endDate` | ISO date | — | Filter records until this date |
| `sortBy` | `date` \| `amount` \| `createdAt` | `date` | Sort field |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |
| `search` | string | — | Full-text search in category + notes |

**Create/Update body**:
```json
{
  "amount": 5000.00,
  "type": "INCOME",
  "category": "Corporate CSR",
  "date": "2026-04-01T00:00:00.000Z",
  "notes": "CSR contribution from Tata Trust"
}
```

### Dashboard Analytics

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/dashboard/summary` | Total donations, expenditures, fund balance | ALL |
| `GET` | `/dashboard/category-totals` | Spending/income grouped by category | ALL |
| `GET` | `/dashboard/recent` | Last 5 fund activities | ALL |
| `GET` | `/dashboard/trends` | Monthly donation vs expenditure (6 months) | ALL |

### User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | List all users |
| `POST` | `/users` | Create user with role |
| `GET` | `/users/:id` | Get user details |
| `PUT` | `/users/:id/role` | Update user role |
| `PUT` | `/users/:id/status` | Activate/deactivate user |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/health` | Server status + timestamp | Public |

---

## Security Model

### Authentication Flow

```
Client → POST /auth/login → { email, password }
Server → bcrypt.compare() → JWT signed with HS256
Client ← { token, user }
Client → GET /records (Authorization: Bearer <token>)
Server → jwt.verify() → Check user exists & isActive → Proceed
```

### Authorization (RBAC)

| Role | Records | Dashboard | User Mgmt |
|------|---------|-----------|-----------|
| **ADMIN** | Full CRUD + Delete | ✅ | Full access |
| **ANALYST** | Create, Read, Update | ✅ | ❌ |
| **VIEWER** | Read only | ✅ | ❌ |

### Key Security Features

- **Rate limiting**: Auth routes limited to 100 requests/15 minutes per IP
- **JWT validation**: Every protected request verifies token + checks user is still active in DB
- **Password hashing**: bcrypt with configurable salt rounds (default: 12)
- **Input validation**: All request bodies and query params validated via Zod schemas before reaching controllers
- **Soft delete**: Records are never physically deleted, only marked with `deletedAt` timestamp

---

## Database Schema

```prisma
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(VIEWER)    // VIEWER | ANALYST | ADMIN
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  financialRecords FinancialRecord[]
}

model FinancialRecord {
  id        String     @id @default(uuid())
  userId    String
  amount    Decimal    @db.Decimal(15, 2)
  type      RecordType                      // INCOME | EXPENSE
  category  String
  date      DateTime
  notes     String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  deletedAt DateTime?                       // Soft-delete marker
  user      User       @relation(...)
}
```

**Indexes**: `userId`, `type`, `category`, `date`, `deletedAt` — optimized for filtered queries and soft-delete exclusion.

---

## Testing

```bash
# Run all tests
npm test

# Run once (CI mode)
npm test -- --run
```

**Test Coverage**:
| Suite | Tests | What it covers |
|-------|-------|----------------|
| `auth.test.ts` | 3 | Registration validation (email, password strength), login |
| `records.test.ts` | 3 | Pagination, sort validation, negative amount rejection |
| `dashboard.test.ts` | 2 | Summary data structure, 6-month trends |
| `roleGuard.test.ts` | 2 | Role-based access enforcement |

Tests use **Supertest** against Express instances with mocked auth guards, hitting the real database for integration-level coverage.

---

## Assumptions

1. **Single-tenant**: The app is designed for a single NGO. All users share the same data pool. There is no multi-organization isolation.
2. **INR currency**: All amounts are in Indian Rupees (₹). The frontend formats using `Intl.NumberFormat('en-IN')`.
3. **Free-text categories**: Categories are user-defined strings, not an enum. This provides flexibility but means categories like "Healthcare" and "healthcare" are treated as different entries.
4. **Dashboard is organization-wide**: Summary, trends, and category totals aggregate **all** records, not per-user. This suits NGO fund oversight.
5. **Soft-delete only**: Records are never permanently removed. The `deletedAt` field is used for logical deletion, and all queries filter by `deletedAt IS NULL`.
6. **Self-registration as VIEWER**: Any user can register but only gets VIEWER role. Only ADMINs can promote users.
7. **Token contains role**: The JWT payload includes the user's role at time of issuance. Role changes take effect on next login.

---

## Tradeoffs

| Decision | Benefit | Tradeoff |
|----------|---------|----------|
| **Prisma ORM** | Type-safe queries, auto-generated types, easy migrations | Raw SQL needed for advanced aggregations (monthly trends `DATE_TRUNC`) |
| **JWT (stateless auth)** | No session store needed, horizontally scalable | Cannot invalidate tokens before expiry (no server-side revocation) |
| **Zod for validation** | Runtime type safety, coercion, detailed error messages | Additional dependency; schemas must be kept in sync with Prisma types manually |
| **Soft-delete pattern** | Data recovery, audit trail, referential integrity preserved | All queries must include `deletedAt IS NULL` filter; storage grows indefinitely |
| **Express v5** | Modern async error handling, improved routing | Newer version; `req.query` is getter-only (requires `Object.defineProperty` workaround in validation middleware) |
| **Global PrismaClient singleton** | Prevents connection pool exhaustion during hot-reload | Relies on `globalThis` trick; may behave differently in edge runtimes |
| **bcrypt over Argon2** | Battle-tested, widely supported, simpler setup | Argon2 is technically more resistant to GPU-based attacks |
| **Role in JWT payload** | Fast authorization checks without DB lookup | Role changes require re-login to take effect |
| **Raw SQL for trends** | Efficient single-query aggregation with `DATE_TRUNC` | Tightly coupled to PostgreSQL; not portable to other databases |

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `tsx watch src/app.ts` | Start dev server with hot-reload (auto-seeds) |
| `build` | `tsc` | Compile TypeScript to JavaScript |
| `start` | `node dist/app.js` | Run production build |
| `test` | `vitest` | Run test suite |
| `prisma:generate` | `prisma generate` | Generate Prisma client types |
| `prisma:migrate` | `prisma migrate dev` | Run database migrations |
| `prisma:seed` | `tsx src/prisma/seed.ts` | Seed NGO sample data (conditional) |

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Director (ADMIN) | `director@zorvyn-ngo.org` | `Admin@123` |
| Coordinator (ANALYST) | `coordinator@zorvyn-ngo.org` | `Analyst@123` |
| Volunteer (ANALYST) | `volunteer@zorvyn-ngo.org` | `Viewer@123` |
