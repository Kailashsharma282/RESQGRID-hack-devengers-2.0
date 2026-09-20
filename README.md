# RESQGRID

### AI-Powered Emergency Intelligence & Response Coordination Platform

> **Engineered for Hack Devengers 2.0**  
> **Author & Lead Developer:** **POCHIRAJU KAILASH RAM MARKANDEYA SHARMA**  
> *"From scattered signals to coordinated response in seconds."*

---

## 1. Executive Summary & Problem

Modern emergency dispatch systems (e.g. traditional 911 / 112) suffer from extreme fragmentation during large-scale crisis events. When a chemical leak, flash flood, structural collapse, or campus fire occurs:
- Hundreds of citizens call in with partial, chaotic signals.
- Operators are overwhelmed by duplicate calls and noisy text/voice descriptions.
- Dispatchers manually cross-reference map pins to estimate resource availability.
- Field responders suffer from delayed, outdated situational briefings.

**ResQGrid** solves this by establishing an **AI Emergency Operations Layer**. It fuses multi-modal reports (text, voice transcripts, photos, coordinates), validates entities with deterministic schemas, calculates spatial/temporal/semantic duplicate clusters, normalizes severity scores, ranks optimal nearby units via multi-factor matching, and synchronizes the entire operation in real time over WebSockets.

---

## 2. Core Differentiator: Emergency Signal Fusion

Instead of treating every citizen report independently, ResQGrid implements **Signal Fusion**:

$$\text{Incoming Signals} = \text{Text} + \text{Voice} + \text{Images} + \text{Crowd Reports} + \text{Resource Telemetry}$$

```
                ┌─────────────────────────────────────────────────────────┐
                │             CITIZEN CROWD SIGNALS & SENSORS             │
                └───────────────────────────┬─────────────────────────────┘
                                            │ Natural Language Reports
                                            ▼
                ┌─────────────────────────────────────────────────────────┐
                │          AI EXTRACTION & STRUCTURED PARSING             │
                │        (Zod Validated + Deterministic Heuristics)       │
                └───────────────────────────┬─────────────────────────────┘
                                            │ Structured Incident
                                            ▼
                ┌─────────────────────────────────────────────────────────┐
                │           DEDUPLICATION & SIGNAL FUSION                 │
                │     Haversine Proximity + Temporal + Semantic Stems     │
                └───────────────────────────┬─────────────────────────────┘
                                            │ Corroborated Emergency State
                                            ▼
                ┌─────────────────────────────────────────────────────────┐
                │          MULTI-FACTOR RESOURCE MATCHING ENGINE          │
                │    Score = w1·Capability + w2·Avail + w3·Prox + w4·ETA  │
                └───────────────────────────┬─────────────────────────────┘
                                            │ Ranked Units & Route Lines
                                            ▼
                ┌─────────────────────────────────────────────────────────┐
                │               COMMAND CENTER OPERATOR APPROVAL          │
                │           Human-In-The-Loop Verification & Dispatch     │
                └───────────────────────────┬─────────────────────────────┘
                                            │ Real-Time WebSocket Event
                                            ▼
                ┌───────────────────────────┴─────────────────────────────┐
                │           RESPONDER APP & LIVE AUDIT TRAIL              │
                │            Accept ➔ En Route ➔ On Scene ➔ Resolved     │
                └─────────────────────────────────────────────────────────┘
```

---

## 3. Key Innovation Pillars

### Pillar 1: DETECT (AI Incident Intelligence)
- Converts raw natural language into strict JSON:
  - **Category**: `FIRE`, `FLOOD`, `MEDICAL`, `ACCIDENT`, `STRUCTURAL`, `ELECTRICAL`, `SECURITY`, `MISSING_PERSON`, `HAZMAT`, `OTHER`
  - **Severity**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - **Casualties**: Affected people and trapped/vulnerable individuals
  - **Required Resources**: `FIRE_TEAM`, `AMBULANCE`, `RESCUE_BOAT`, etc.
  - **Confidence Score** & Keywords
- **100% Deterministic Fallback Mode**: If `LLM_API_KEY` is omitted, ResQGrid runs offline with deterministic heuristic NLP matching so it never fails during judging.

### Pillar 2: DECIDE (Deduplication & Multi-Factor Matching)
- **Geospatial Haversine Proximity**:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Temporal & Semantic Root Matching**: Fuses reports within a 2.5 km radius and 12-hour window sharing $\ge 65\%$ confidence.
- **Resource Matching Formula**:
  $$\text{MatchingScore} = 0.35 \cdot \text{Capability} + 0.30 \cdot \text{Availability} + 0.25 \cdot \text{Proximity} + 0.10 \cdot \text{Capacity}$$

### Pillar 3: RESPOND (Command Center & Field Responder MDT)
- Real-time dark operations map with Leaflet, radar pulse rings, and tactical route polylines.
- Mobile-responsive field responder application with one-tap status updates (`Accept`, `En Route`, `On Scene`, `Resolved`).
- Full auditability recording 50+ actions into an immutable ledger.

---

## 4. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Leaflet, React-Leaflet, Framer Motion, Recharts, Lucide Icons, Socket.IO Client |
| **Backend** | Node.js, Express, TypeScript, Socket.IO, Prisma ORM, Zod Schema Validation, BCrypt, JWT |
| **Database** | SQLite (zero-setup dev & demo mode) / PostgreSQL (production-ready via `DATABASE_URL`) |
| **Architecture** | Clean Modular Monorepo with shared `@resqgrid/types` contract |

---

## 5. Quick Start & Running Locally

### Prerequisites
- Node.js `v18+` or `v20+` or `v25+`
- npm `v9+`

### 1. Clone & Install
```bash
git clone <repo-url>
cd ResQGrid-hackathon-project
npm install
```

### 2. Database Sync & Seed
```bash
# Push Prisma schema and seed 20 users, 20 resources, 15 incidents, 30 reports, 10 dispatches
npm run seed
```

### 3. Run Development Servers
```bash
# Concurrently runs API on port 3001 and Web App on port 5173
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 6. Three-Minute Hackathon Demo Guide

1. **0:00 — Launch Command Center**: Open `http://localhost:5173/command`. Inspect live incident feed, tactical radar map, and KPI metrics.
2. **0:25 — Transmit Emergency Report**: Navigate to `/report`. Click preset *"Campus Chemical Fire"*. Observe the 4-phase animated AI extraction modal generating incident `RQ-2026-0042`.
3. **0:50 — Corroborate Duplicate Signal**: Submit a secondary report *"Huge smoke and flames pouring from chemistry windows"*. Witness the Deduplication Engine detect a 79% match and fuse it into the primary incident.
4. **1:20 — Smart Resource Dispatch**: Click on `RQ-2026-0042` in Command Center. Inspect the recommended units (Engine 02, Medic 04, Trauma Team 07). Click **"Dispatch Recommended Units"**.
5. **1:50 — Responder Workflow**: Navigate to `/responder`. Switch role to *"Capt. James Miller (Engine 02)"*. Click **Accept** ➔ **Mark En Route** ➔ **Mark Arrived On Scene**.
6. **2:30 — Resolution**: Mark incident resolved. Watch the confetti celebration, resource status return to `AVAILABLE`, and the Command Center timeline close.
7. **2:50 — Executive Analytics**: Open `/analytics` to review lives assisted, duplicate calls consolidated, and response minutes saved.

*(Alternatively, click the **"⚡ Live Demo"** button in the navbar to execute the full automated sequence in 1 click!)*

---

## 7. Project Documentation

- [`docs/architecture.md`](docs/architecture.md) — Detailed system architecture and data flows.
- [`docs/api.md`](docs/api.md) — Complete REST API endpoint documentation with payload schemas.
- [`docs/ai-pipeline.md`](docs/ai-pipeline.md) — AI signal extraction, Zod schema, and fallback engine.
- [`docs/database.md`](docs/database.md) — Prisma relational models, indexes, and seed architecture.
- [`docs/demo.md`](docs/demo.md) — Step-by-step presentation script for judges.

---

## 8. Hackathon Attribution

- **Event:** **Hack Devengers 2.0**
- **Project Name:** **ResQGrid**
- **Lead Developer:** **POCHIRAJU KAILASH RAM MARKANDEYA SHARMA**
- **License:** MIT
