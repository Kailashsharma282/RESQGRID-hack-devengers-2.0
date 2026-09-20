# Database Architecture & Relational Models — ResQGrid

> **Hackathon:** **Hack Devengers 2.0**  
> **Lead Architect & Developer:** **POCHIRAJU KAILASH RAM MARKANDEYA SHARMA**

---

## 1. Dual-Engine Persistence Strategy

ResQGrid implements a dual-engine database strategy designed for zero-friction local development and evaluation, alongside high-throughput, serverless production scalability via **Neon DB**:

| Dimension | Local Development / Demo | Cloud Production (Neon DB) |
|---|---|---|
| **Database Engine** | SQLite 3 (`dev.db`) | Serverless PostgreSQL 16 |
| **Prisma Schema** | `prisma/schema.prisma` (`schema.sqlite.prisma`) | `prisma/schema.neon.prisma` |
| **Connection Pooling** | In-process file handle | PgBouncer managed pooler (`DATABASE_URL`) |
| **Migrations** | `npm run prisma:push` | `npm run prisma:neon:push` / `prisma:neon:migrate` (`DIRECT_URL`) |
| **Column Types** | TEXT, REAL, INTEGER | Native `ENUM`, `JSONB`, `TIMESTAMP WITH TIME ZONE` |

---

## 2. Neon DB Configuration & Connectivity

Neon DB provides serverless PostgreSQL with instant scale-to-zero and managed connection pooling. ResQGrid requires two distinct connection strings in production:

### 2.1 Pooled Connection (`DATABASE_URL`)
Used by the runtime Express API application for serving queries under high concurrency:
```env
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require&pgbouncer=true"
```
- **Why PgBouncer?** Serverless container scaling can spin up dozens of API instances during a crisis. The pooled connection maintains persistent backend connections to Postgres, preventing connection exhaustion errors.

### 2.2 Direct Unpooled Connection (`DIRECT_URL`)
Used exclusively by Prisma CLI for running schema migrations, introspection, and DDL commands:
```env
DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require"
```
- **Why Direct?** Schema migrations (`ALTER TABLE`, advisory locks) cannot execute through PgBouncer transaction-level pooling. Prisma uses `directUrl` specifically for administrative DDL operations.

---

## 3. Schema Entities & Relational Design

The Prisma schema defines seven normalized models optimized for indexed geospatial and temporal querying:

```
┌───────────────┐          1:N          ┌───────────────────┐
│     User      ├───────────────────────┤  IncidentReport   │
└───────┬───────┘                       └─────────┬─────────┘
        │ 1:N                                     │ N:1
        ▼                                         ▼
┌───────────────┐          1:N          ┌───────────────────┐
│   AuditLog    │                       │     Incident      │
└───────────────┘                       └───┬─────────────┬─┘
                                            │ 1:N         │ 1:N
                                            ▼             ▼
                                     ┌────────────┐ ┌───────────────┐
                                     │  Dispatch  │ │ Notification  │
                                     └─────┬──────┘ └───────────────┘
                                           │ N:1
                                           ▼
                                    ┌──────────────┐
                                    │   Resource   │
                                    └──────────────┘
```

### 3.1 Entity Specifications

1. **`User`**:
   - `id` (CUID/UUID), `name`, `email` (unique), `phone`, `passwordHash`, `role` (`CITIZEN`, `OPERATOR`, `RESPONDER`, `ADMIN`), `avatar`, `isActive`, `createdAt`, `updatedAt`.
2. **`Incident`**:
   - `id`, `incidentCode` (unique human-readable code e.g. `RQ-2026-0042`), `title`, `description`, `category` (enum: `FIRE`, `FLOOD`, `EARTHQUAKE`, `MEDICAL`, `HAZMAT`, `STRUCTURAL_COLLAPSE`, `ROAD_ACCIDENT`, `OTHER`), `severity` (enum: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), `status` (enum: `REPORTED`, `VERIFIED`, `RESPONDING`, `ON_SCENE`, `RESOLVED`, `CANCELLED`), `latitude`, `longitude`, `address`, `affectedPeople`, `vulnerablePeople`, `confidenceScore`, `priorityScore` (0–100), `source`, `aiSummary`, `aiReasoning`, `resolvedAt`, `createdAt`, `updatedAt`.
   - **Indexes**: `[status]`, `[severity]`, `[category]`, `[createdAt]`.
3. **`IncidentReport`**:
   - `id`, `incidentId` (foreign key to `Incident`), `reporterId` (optional user foreign key), `text`, `mediaUrl`, `source`, `latitude`, `longitude`, `extractedData` (JSONB in Postgres), `confidenceScore`, `createdAt`.
4. **`Resource`**:
   - `id`, `name`, `type` (enum: `AMBULANCE`, `FIRE_TRUCK`, `RESCUE_BOAT`, `HAZMAT_UNIT`, `POLICE_UNIT`, `DRONE_RECON`, `MEDICAL_TEAM`), `status` (enum: `AVAILABLE`, `ASSIGNED`, `EN_ROUTE`, `ON_SCENE`, `UNAVAILABLE`), `capacity`, `latitude`, `longitude`, `organization`, `contact`, `capabilities` (JSONB in Postgres), `createdAt`, `updatedAt`.
5. **`Dispatch`**:
   - `id`, `incidentId` (FK), `resourceId` (FK), `assignedBy` (FK User), `status` (enum: `ASSIGNED`, `ACCEPTED`, `EN_ROUTE`, `ON_SCENE`, `COMPLETED`, `CANCELLED`), `assignedAt`, `acceptedAt`, `arrivedAt`, `completedAt`, `etaMinutes`, `distanceKm`, `notes`.
6. **`Notification`**:
   - `id`, `userId` (FK), `incidentId` (FK, optional), `type`, `title`, `message`, `isRead`, `createdAt`.
7. **`AuditLog`**:
   - `id`, `userId` (FK, optional), `action`, `entityType`, `entityId`, `metadata` (JSONB), `createdAt`.

---

## 4. Migration & Seeding Workflows

### 4.1 Running on Neon DB (Production)
1. Configure credentials in `apps/api/.env`:
   ```bash
   DATABASE_URL="postgresql://...@...-pooler.neon.tech/neondb?sslmode=require&pgbouncer=true"
   DIRECT_URL="postgresql://...@....neon.tech/neondb?sslmode=require"
   ```
2. Generate the PostgreSQL Prisma client:
   ```bash
   npm run prisma:neon:generate
   ```
3. Push the schema to Neon DB:
   ```bash
   npm run prisma:neon:push
   ```
4. Populate initial data:
   ```bash
   npm run seed
   ```

### 4.2 Running on SQLite (Local Fallback)
1. Default environment settings (`DATABASE_URL="file:./dev.db"`).
2. Push schema and seed:
   ```bash
   npm run prisma:push && npm run seed
   ```
