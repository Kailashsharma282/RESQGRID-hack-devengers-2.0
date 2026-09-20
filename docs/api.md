# REST API Specification — ResQGrid

> **Hackathon:** **Hack Devengers 2.0**  
> **Lead Architect & Developer:** **POCHIRAJU KAILASH RAM MARKANDEYA SHARMA**

## Base URL
`http://localhost:3001/api`

---

## Edge & Gateway Standards
- **Distributed Tracing**: Every response includes an `X-Request-Id` UUID header.
- **Security Headers**: Standard Helmet suite enabled (HSTS, strict MIME types, CSP frame ancestors).
- **Rate Limiting**:
  - Global: 200 requests/minute per IP (`HTTP 429 Too Many Requests` on breach).
  - Report Ingestion: 60 requests/minute per IP.

---

## 1. Incidents

### `GET /api/incidents`
Retrieve active and historical incidents.
- **Query Parameters**:
  - `category` (optional): `FIRE`, `FLOOD`, `MEDICAL`, `HAZMAT`, `STRUCTURAL_COLLAPSE`, `ROAD_ACCIDENT`, `EARTHQUAKE`, `OTHER`
  - `severity` (optional): `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
  - `status` (optional): `REPORTED`, `VERIFIED`, `RESPONDING`, `ON_SCENE`, `RESOLVED`
  - `search` (optional): substring search across title, code, address

### `GET /api/incidents/:id`
Retrieve incident detail with candidate resource recommendations computed in real time.

### `POST /api/incidents/:id/verify`
Operator verifies AI incident recommendation.
- **Body**: `{ "operatorId": "uuid", "notes": "string" }`

### `POST /api/incidents/:id/dispatch`
Dispatch selected resources.
- **Body**: `{ "resourceIds": ["uuid1", "uuid2"], "operatorId": "uuid", "notes": "string" }`

### `POST /api/incidents/:id/resolve`
Mark incident resolved, completing dispatches and returning units to `AVAILABLE`.
- **Body**: `{ "operatorId": "uuid", "resolutionNotes": "string" }`

### `POST /api/incidents/:id/merge`
Merge duplicate secondary incident into primary incident. Emits `incident.merged` domain event.
- **Body**: `{ "sourceIncidentId": "uuid", "operatorId": "uuid" }`

---

## 2. Emergency Ingestion & AI Pipeline

### `POST /api/reports`
Ingest unstructured emergency report, trigger AI extraction and deduplication check.
- **Rate Limit**: 60 requests/minute.
- **Body**:
  ```json
  {
    "text": "Smoke and fire near chemistry building. 12 students trapped.",
    "category": "FIRE",
    "latitude": 37.7758,
    "longitude": -122.4182,
    "address": "Chemistry Hall Block C",
    "source": "WEB_APP",
    "mediaUrl": "https://resqgrid-media.s3.amazonaws.com/uploads/photo123.jpg"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "isDuplicate": false,
    "incidentCode": "RQ-2026-0042",
    "aiAnalysis": {
      "category": "FIRE",
      "severity": "CRITICAL",
      "affectedCount": 12,
      "hazards": ["TOXIC_GAS", "TRAPPED_PEOPLE"],
      "confidence": 0.94
    },
    "recommendedResources": [ ... ]
  }
  ```

---

## 3. Storage & Media (AWS S3 & Fallback)

### `GET /api/storage/status`
Checks the current storage provider and cloud bucket health.
- **Response**:
  ```json
  {
    "status": "healthy",
    "provider": "s3",
    "bucket": "resqgrid-emergency-media",
    "region": "us-east-1"
  }
  ```

### `POST /api/storage/presigned-url`
Generates a pre-signed AWS S3 URL for secure direct-to-S3 client uploads.
- **Body**:
  ```json
  {
    "fileName": "site_damage_evidence.jpg",
    "contentType": "image/jpeg"
  }
  ```
- **Response**:
  ```json
  {
    "uploadUrl": "https://resqgrid-emergency-media.s3.us-east-1.amazonaws.com/uploads/guid-site_damage_evidence.jpg?X-Amz-Signature=...",
    "fileKey": "uploads/guid-site_damage_evidence.jpg",
    "publicUrl": "https://resqgrid-emergency-media.s3.us-east-1.amazonaws.com/uploads/guid-site_damage_evidence.jpg",
    "expiresIn": 900
  }
  ```

### `POST /api/storage/upload`
Direct multi-part form upload endpoint handled by the API gateway (supporting both AWS S3 backend and local disk storage).
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (binary payload, max 25MB)
- **Response**:
  ```json
  {
    "success": true,
    "file": {
      "fileKey": "uploads/1789740000000-field-report.jpg",
      "url": "http://localhost:3001/uploads/1789740000000-field-report.jpg",
      "originalName": "field-report.jpg",
      "size": 1048576,
      "contentType": "image/jpeg"
    }
  }
  ```

---

## 4. Resources & Fleet

### `GET /api/resources`
List all apparatus and response units.
- **Query Parameters**: `type`, `status`, `organization`

### `GET /api/resources/nearby`
Find resources within geographic radius using spherical trigonometry.
- **Query Parameters**: `lat`, `lon`, `radiusKm`

### `PATCH /api/resources/:id`
Update unit status (`AVAILABLE`, `ASSIGNED`, `EN_ROUTE`, `ON_SCENE`, `UNAVAILABLE`).

---

## 5. Dispatches & Tactical MDT

### `GET /api/dispatches`
List active dispatches with linked incidents and resource units.

### `PATCH /api/dispatches/:id/status`
Transition dispatch state:
- `ACCEPTED` ➔ `EN_ROUTE` ➔ `ON_SCENE` ➔ `COMPLETED`
Emits real-time WebSocket notifications to the command radar.

---

## 6. Observability, Health & Telemetry

### `GET /metrics`
Prometheus-formatted scraping endpoint exposing process metrics, request histograms, and operational gauges.

### `GET /health/live`
Kubernetes/container liveness probe confirming process responsiveness.

### `GET /health/ready`
Readiness probe verifying active database connection and storage subsystem reachability.
