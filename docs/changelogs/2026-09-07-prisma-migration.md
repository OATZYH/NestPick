# Changelog: 2026-09-07 - Prisma ORM Migration & Docker Compose Setup (v0.2.0)

## Overview
Migrated the database layer from raw `pg` SQL scripts to **Prisma ORM 7** with PostgreSQL, added local testing infrastructure via **Docker Compose**, and cleaned up project dependencies.

## Key Changes

### 1. Prisma ORM Integration
- **Prisma Schema (`prisma/schema.prisma`)**:
  - Defined idiomatic models mapping to the PostgreSQL database:
    - `Listing` (`listings`)
    - `PriceHistory` (`price_history`)
    - `Contract` (`contracts`)
    - `ViewingLog` (`viewing_logs`)
    - `CenterPoint` (`center_points`)
    - `PropertyType` (`property_types`)
    - `PipelineStatus` (`pipeline_statuses`)
  - Configured cascade delete constraints on child models (`PriceHistory`, `Contract`, `ViewingLog`).
- **Prisma Configuration (`prisma7.config.ts`)**:
  - Configured datasource URL with fallback to `DATABASE_URL_UNPOOLED` for CLI operations and migrations.
- **Client Singleton (`lib/prisma.ts`)**:
  - Implemented `@prisma/adapter-pg` driver adapter for connection pooling.
  - Added smart SSL handling (disabled for localhost/Docker, enabled with `{ rejectUnauthorized: false }` for cloud providers like Neon).
  - Created global singleton instance to prevent connection exhaustion during Next.js hot module reloading.

### 2. Database Seeding
- **Prisma Seed Script (`scripts/seed.ts`)**:
  - Migrated from raw SQL queries (`TRUNCATE`, `INSERT INTO`) to type-safe `prisma.upsert` calls with nested relations.
  - Successfully seeds all initial property types, pipeline statuses, reference center points, listings, price histories, contracts, and viewing logs.

### 3. Local Development with Docker Compose
- **Container Setup (`docker-compose.yml`)**:
  - Added PostgreSQL 17 Alpine service (`nestpick-postgres`) on port `5432:5432`.
  - Configured persistent volume `postgres_data` and healthcheck.
- **Environment Configuration**:
  - Cleaned cloud Neon credentials from `.env.local` and `.env`, configuring local connection string (`postgresql://postgres:password@localhost:5432/nestpick`).
  - Added `.env.example` template.

### 4. Dependency Cleanup & NPM Scripts
- **Unused Dependency Removal**:
  - Removed `ajv` and `@radix-ui/react-scroll-area`.
- **New Scripts in `package.json`**:
  - `bun run db:up`: Start PostgreSQL container.
  - `bun run db:down`: Stop PostgreSQL container.
  - `bun run prisma:push`: Push schema to database without migrations.
  - `bun run prisma:generate`: Regenerate Prisma Client.
  - `bun run prisma:migrate`: Run Prisma migrations.
  - `bun run prisma:studio`: Open Prisma Studio web UI.
  - `bun run db:seed`: Seed database with mock data.
  - `postinstall`: Automatically generate Prisma Client on package install.
