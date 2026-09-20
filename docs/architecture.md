# System Architecture & Enterprise Design — ResQGrid

> **Hackathon:** **Hack Devengers 2.0**  
> **Lead Architect & Developer:** **POCHIRAJU KAILASH RAM MARKANDEYA SHARMA**

---

## 1. High-Level System Architecture

ResQGrid is engineered as a high-throughput, cloud-native, scalable emergency intelligence platform adhering to microservices principles and domain-driven design:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT & PRESENTATION LAYER                           │
│  - React 18 + Vite Web App (Tactical Command Center, Analytics, MDT)           │
│  - Citizen Mobile Emergency Reporting Portal (Multi-modal Voice/Text/Media)    │
│  - Multi-Resolution Responsive Engine (Desktop 1536px, Tablet 768px, Mobile)   │
└───────────────────────────────┬───────────────────────────────▲─────────────────┘
                                │ HTTP/REST (JSON + FormData)   │ WebSockets (Socket.IO)
                                ▼                               │
┌───────────────────────────────────────────────────────────────┴─────────────────┐
│                      API GATEWAY & EDGE SECURITY LAYER                          │
│  - Reverse Proxy / Ingress (Nginx Alpine with Gzip compression)                │
│  - Security Headers: Helmet (HSTS, CSP, X-Frame-Options, DNS Prefetch)         │
│  - Rate Limiting: express-rate-limit (60 req/min reports, 200 req/min global)  │
│  - Distributed Tracing: X-Request-Id correlation header propagation             │
│  - JWT Stateless Authentication & Role-Based Authorization Guard               │
└───────────────────────────────┬─────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   DOMAIN EVENTS   │   │  CORE ENGINES     │   │ STORAGE & MEDIA   │
│   (DomainEventBus)│   │  (Business Logic) │   │ (StorageFactory)  │
└─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
          │                       │                       │
          │                       │                       │
          ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ - IncidentCreated │   │ - AI Signal Engine│   │ - AWS S3 Service  │
│ - IncidentMerged  │   │ - Dedup Pipeline  │   │   (Presigned URLs)│
│ - DispatchAssigned│   │ - Matching Engine │   │ - Local Storage   │
│ - UnitStateChanged│   │ - Severity Engine │   │   (Dev Fallback)  │
└─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE & OBSERVABILITY LAYER                          │
│  - Production DB: Neon DB (Serverless PostgreSQL + Connection Pooling)          │
│  - Direct DB: Neon Direct Connection (Schema migrations & DDL)                  │
│  - Local Dev Fallback: SQLite via Prisma ORM 5.x                                │
│  - Telemetry: Prometheus Metrics (/metrics) & Probes (/health/live, /ready)     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Microservices & Resiliency Patterns

### 2.1 Circuit Breaker Pattern (`CircuitBreaker`)
External LLM APIs (e.g. OpenAI, Anthropic) are subject to network degradation and rate limiting during mass casualty events. ResQGrid encapsulates all external AI calls within a stateful Circuit Breaker:
- **`CLOSED`**: Normal operation. Calls pass through to the primary LLM provider.
- **`OPEN`**: Tripped after consecutive failures exceeding threshold ($N \ge 3$). Calls fail fast and immediately invoke the deterministic offline NLP classifier without latency spikes.
- **`HALF-OPEN`**: After recovery cooldown ($30\text{s}$), canary requests test provider health before resuming full traffic.
- **Exponential Backoff**: Transient errors retry with jittered exponential delay ($2^k \times 200\text{ms}$).

### 2.2 Event-Driven Architecture (`DomainEventBus`)
To maintain loose coupling between subsystems, core operations emit domain events:
- `incident.created`
- `incident.verified`
- `incident.merged`
- `dispatch.assigned`
- `responder.status_updated`
- `incident.resolved`

Subscribers handle side-effects asynchronously:
1. **WebSocket Gateway**: Dispatches live delta payloads to connected tactical screens.
2. **Audit Telemetry**: Records immutable `AuditLog` rows for command accountability.
3. **Notification Engine**: Pushes alerts to field responders and command staff.

### 2.3 Edge Security & Rate Limiting
- **Global Rate Limiting**: 200 requests per minute per IP address preventing denial-of-service.
- **Report Ingestion Limiting**: 60 reports per minute per IP address with burst mitigation.
- **Helmet Security**: Disables `X-Powered-By`, enables strict MIME-type sniffing prevention, and configures cross-origin isolation.
- **Request ID Tracking**: Every HTTP request receives an `X-Request-Id` UUID forwarded to downstream service logs.

---

## 3. Cloud Persistence: Neon DB Architecture

ResQGrid supports **Neon DB Serverless PostgreSQL** out of the box:
- **Connection Pooling**: Managed PgBouncer pooled connection string (`DATABASE_URL`) handles high concurrent connection spikes without exhausting backend database memory.
- **Direct Connection (`DIRECT_URL`)**: Bypasses connection poolers for transactional DDL operations, Prisma migrations, and schema introspection.
- **Native Relational Types**: Uses native PostgreSQL `enum` types for incidents, severity, roles, and dispatch states, plus native `JSONB` for multi-modal AI extraction schemas and audit payloads.
- **Dual Schema Support**:
  - `prisma/schema.neon.prisma`: Production PostgreSQL schema with connection pooling.
  - `prisma/schema.sqlite.prisma`: Zero-setup local development and evaluation environment.

---

## 4. File & Media Storage: AWS S3 Integration

Emergency incident reporting frequently requires high-resolution media (photos, videos, drone footage, audio dispatch transcripts). ResQGrid decouples media delivery via **AWS S3**:
- **Interface Segregation (`IStorageService`)**: Defines standard contracts for file storage, presigned upload URLs, and download URLs.
- **AWS S3 Service (`S3StorageService`)**:
  - Uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
  - Generates secure, short-lived presigned upload URLs (15-minute expiry) enabling direct-to-S3 browser uploads that bypass the API gateway and eliminate bandwidth bottlenecks.
  - Generates secure presigned read URLs with cache control headers.
  - Compatible with AWS S3, Cloudflare R2, MinIO, and LocalStack via custom `AWS_S3_ENDPOINT`.
- **Local Fallback (`LocalStorageService`)**:
  - Automatically activated when AWS credentials are not configured, storing files in `./uploads` and serving them statically.
  - Zero-friction developer setup without requiring cloud accounts.

---

## 5. Observability & Telemetry

ResQGrid implements production-grade monitoring:
- **Prometheus Metrics (`/metrics`)**:
  - Default Node.js process metrics (memory, heap, event loop lag, CPU usage).
  - Custom HTTP request duration histogram (`resqgrid_http_request_duration_seconds`).
  - Emergency reports ingested counter (`resqgrid_emergency_reports_total`).
  - Active incidents gauge (`resqgrid_active_incidents_count`).
  - Dispatch transitions counter (`resqgrid_dispatch_status_transitions_total`).
- **Liveness Probe (`/health/live`)**:
  - Validates process execution and memory thresholds for Kubernetes/Docker container restarts.
- **Readiness Probe (`/health/ready`)**:
  - Pings the database connection and storage subsystem before accepting inbound load-balancer traffic.

---

## 6. Containerization & Production Topology

The repository includes complete multi-stage container definitions:
- **`apps/api/Dockerfile`**: Alpine Node 20 multi-stage build running as non-root user with production dependency pruning.
- **`apps/web/Dockerfile` & `nginx.conf`**: High-performance Nginx Alpine web server with gzip compression, cache headers for immutable assets, and SPA route fallback.
- **`docker-compose.yml`**: Orchestrates:
  - `resqgrid-api` (Express backend, port 3001)
  - `resqgrid-web` (Nginx frontend, port 5173 / 80)
  - `resqgrid-postgres` (PostgreSQL 16 persistence)
  - `resqgrid-redis` (Redis 7 pub/sub and caching)
  - `resqgrid-minio` (S3-compatible local object storage)
