# Financial Records API

A production-grade REST API for managing financial records with role-based access control,
JWT authentication, and analytics dashboards.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Role Permissions](#role-permissions)
- [Project Structure](#project-structure)
- [Response Format](#response-format)
- [Technical Decisions](#technical-decisions)
- [Trade-offs](#trade-offs)
- [Additional Notes](#additional-notes)
- [License](#license)

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | NestJS (Node.js)                    |
| Language     | TypeScript                          |
| Database     | MySQL                               |
| ORM          | Prisma                              |
| Auth         | JWT via @nestjs/jwt + Passport      |
| Validation   | class-validator + class-transformer |
| Docs         | Swagger UI (@nestjs/swagger)        |
| Testing      | Jest + Supertest                    |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MySQL running locally or a remote MySQL instance
- pnpm (or npm)

### Installation

```bash
git clone https://github.com/NabarupDev/FinTrack
cd FinTrack
pnpm install
```

### Environment Setup

```bash
cp .env.example .env
```

Fill in your values:

| Variable        | Description                         | Example                                          |
|-----------------|-------------------------------------|--------------------------------------------------|
| DATABASE_URL    | Prisma MySQL connection string      | mysql://root:your_db_password@localhost:3306/financial_db |
| JWT_SECRET      | Secret key for JWT signing          | change_as_u_need                                   |
| JWT_EXPIRES_IN  | Token expiry duration               | 7d                                               |
| NODE_ENV        | Environment                         | development                                      |
| PORT            | Server port                         | 3000                                             |

### Database Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Seed Database (Optional)

Populate the database with test users and sample records:

```bash
npx prisma db seed
```

Test credentials (password: `password123`):

| Role    | Email                  |
|---------|------------------------|
| Admin   | admin@example.com      |
| Analyst | analyst@example.com    |
| Viewer  | viewer@example.com     |

### Run

```bash
pnpm run start:dev    # development with hot reload
pnpm run start:prod   # production build
```

- API base URL: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`

---

## Testing

### Unit Tests

```bash
pnpm run test
```

### End-to-End Tests

```bash
pnpm run test:e2e
```

### Test Coverage

```bash
pnpm run test:cov
```

### Test Structure

```
test/
  app.e2e-spec.ts         # Health check and response envelope tests
  auth.e2e-spec.ts        # Authentication flow tests
  users.e2e-spec.ts       # User management CRUD tests
  records.e2e-spec.ts     # Financial records CRUD tests
  dashboard.e2e-spec.ts   # Dashboard analytics tests
  setup.ts                # Test app bootstrap
  types.ts                # Shared type definitions
```

---

## API Reference

### Auth (public)

| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| POST   | /api/auth/register   | Register new user    |
| POST   | /api/auth/login      | Login, receive token |

### Users (Admin only)

| Method | Endpoint                   | Description                    |
|--------|----------------------------|--------------------------------|
| POST   | /api/users                 | Create user                    |
| GET    | /api/users                 | List users (filter: role, status) |
| GET    | /api/users/:id             | Get user by id                 |
| PATCH  | /api/users/:id             | Update user                    |
| PATCH  | /api/users/:id/status      | Activate or deactivate         |
| DELETE | /api/users/:id             | Delete user                    |

### Records

| Method | Endpoint            | Role            | Description                       |
|--------|---------------------|-----------------|-----------------------------------|
| POST   | /api/records        | ADMIN           | Create record                     |
| GET    | /api/records        | ADMIN, ANALYST  | List records (filter + paginate)  |
| GET    | /api/records/:id    | ADMIN, ANALYST  | Get record by id                  |
| PATCH  | /api/records/:id    | ADMIN           | Update record                     |
| DELETE | /api/records/:id    | ADMIN           | Delete record                     |

Query params for GET /api/records:

| Param     | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| type      | string | Filter by INCOME or EXPENSE                |
| category  | string | Case-insensitive contains match            |
| startDate | date   | Records on or after this date (ISO format) |
| endDate   | date   | Records on or before this date (ISO format)|
| search    | string | Search in category or notes                |
| page      | number | Page number (default: 1)                   |
| limit     | number | Results per page (default: 10, max: 100)   |

### Dashboard (all roles)

| Method | Endpoint                             | Description                         |
|--------|--------------------------------------|-------------------------------------|
| GET    | /api/dashboard/total-income          | Sum of all income records           |
| GET    | /api/dashboard/total-expense         | Sum of all expense records          |
| GET    | /api/dashboard/net-balance           | Income, expense, and net balance    |
| GET    | /api/dashboard/category-summary      | Totals grouped by category          |
| GET    | /api/dashboard/recent-transactions   | Last 10 records                     |
| GET    | /api/dashboard/monthly-trend         | Income vs expense, last 12 months   |

---

## Role Permissions

| Endpoint Group          | ADMIN | ANALYST | VIEWER |
|-------------------------|:-----:|:-------:|:------:|
| POST /api/auth          | Y     | Y       | Y      |
| /api/users (all)        | Y     | N       | N      |
| POST /api/records       | Y     | N       | N      |
| GET /api/records        | Y     | Y       | N      |
| PATCH/DELETE /records   | Y     | N       | N      |
| /api/dashboard (all)    | Y     | Y       | Y      |

---

## Project Structure

```
src/
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
      register.dto.ts
      login.dto.ts
    strategies/
      jwt.strategy.ts
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/
      create-user.dto.ts
      update-user.dto.ts
      update-status.dto.ts
  records/
    records.module.ts
    records.controller.ts
    records.service.ts
    dto/
      create-record.dto.ts
      update-record.dto.ts
      filter-record.dto.ts
  dashboard/
    dashboard.module.ts
    dashboard.controller.ts
    dashboard.service.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  common/
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    decorators/
      roles.decorator.ts
      current-user.decorator.ts
    filters/
      all-exceptions.filter.ts
      http-exception.filter.ts
      prisma-exception.filter.ts
    interceptors/
      transform-response.interceptor.ts
    interfaces/
      api-response.interface.ts
    enums/
      role.enum.ts
  app.module.ts
  app.controller.ts
  app.service.ts
  main.ts
prisma/
  schema.prisma
  seed.ts
test/
  *.e2e-spec.ts
```

---

## Response Format

All successful responses are wrapped by a global interceptor:

```json
{
  "success": true,
  "data": { ... }
}
```

All error responses use a standardized envelope:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed"
  }
}
```

Error codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `DUPLICATE_ENTRY`, `VALIDATION_ERROR`, `FOREIGN_KEY_ERROR`, `DATABASE_ERROR`, `INTERNAL_ERROR`

---

## Technical Decisions

### Architecture

- **Modular design**: Each feature (auth, users, records, dashboard) is a self-contained NestJS module with its own controller, service, and DTOs. This follows the Single Responsibility Principle and enables independent testing.

- **Prisma ORM**: Chosen over TypeORM or raw SQL for type-safe queries with auto-completion. The schema file serves as the single source of truth for both database migrations and TypeScript types.

- **DTO-based validation**: Validation logic is declared at the DTO level using class-validator decorators. The global ValidationPipe runs validation before any controller method executes.

- **Guard-based authorization**: NestJS guards with the `@Roles()` decorator provide RBAC. This is more idiomatic than middleware-based authorization and integrates with NestJS metadata reflection.

### Error Handling

- **Three-layer exception filters**: Registered in order: `AllExceptionsFilter` (catch-all), `PrismaExceptionFilter` (database errors), `HttpExceptionFilter` (HTTP exceptions). This ensures every error is caught and returned in a consistent format.

- **Prisma error translation**: Database errors (P2002 unique constraint, P2025 not found, P2003 foreign key) are translated to appropriate HTTP status codes and user-friendly messages.

### Response Consistency

- **Global response interceptor**: Every successful response is wrapped in `{ success: true, data }`. Frontend consumers always receive a predictable envelope regardless of the endpoint.

- **Global PrismaModule**: Marked with `@Global()` so PrismaService is injectable anywhere without explicit module imports.

---

## Trade-offs

### Stateless JWT vs Session-based Auth

**Chosen**: Stateless JWT tokens without refresh token flow.

**Pros**:
- Simpler implementation
- No server-side session storage required
- Scales horizontally without session synchronization

**Cons**:
- Cannot revoke tokens before expiry
- No token blacklist for logout
- Longer token expiry needed for usability

### Hard Delete vs Soft Delete

**Chosen**: Hard delete for financial records.

**Pros**:
- Simpler queries (no `deletedAt` filters)
- Smaller database size
- GDPR compliance for data removal

**Cons**:
- No audit trail for deleted records
- No recovery option for accidental deletes
- May not meet financial audit requirements in some jurisdictions

### Float vs Decimal for Amounts

**Chosen**: MySQL FLOAT for the amount field.

**Pros**:
- Simpler type conversion in JavaScript
- Sufficient precision for most use cases

**Cons**:
- Potential floating-point precision issues
- Not suitable for exact financial calculations at scale
- Production systems should consider DECIMAL(19,4)

### Raw SQL for Monthly Trend

**Chosen**: Prisma `$queryRaw` for the monthly trend aggregation.

**Pros**:
- MySQL DATE_FORMAT enables efficient grouping by month
- Single query instead of multiple aggregations

**Cons**:
- Bypasses Prisma type safety
- MySQL-specific (not portable to other databases)
- Requires manual result type casting

---

## Additional Notes

### Security Considerations

- Passwords are hashed using bcrypt with a cost factor of 10
- JWT secrets should be at least 256 bits in production
- The password field is explicitly excluded from all user responses
- Admin users cannot delete their own account to prevent lockout
- Input validation rejects unknown fields (whitelist mode)

### Performance Considerations

- Database indexes are defined on frequently queried fields (type, category, date, createdBy)
- Pagination is enforced with a maximum limit of 100 records per request
- Dashboard queries use Prisma aggregate functions for efficient calculations

### Extensibility

- New roles can be added to the Prisma schema enum and the guards will automatically recognize them
- Additional financial record types can be added to the RecordType enum
- The modular architecture allows new feature modules to be added without modifying existing code

### Known Limitations

- No file upload support for receipts or attachments
- No multi-tenancy support (all users share the same data)
- No rate limiting implemented
- No request logging or audit trail
- Monthly trend is limited to the last 12 calendar months

### Future Improvements

- Implement refresh token rotation for enhanced security
- Add soft delete with audit trail for compliance
- Migrate amount field to DECIMAL for precision
- Add rate limiting and request throttling
- Implement comprehensive request logging

---

## License

UNLICENSED
