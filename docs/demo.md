# Hackathon Demo Guide (3-Minute Presentation) — ResQGrid

> **Hack Devengers 2.0**  
> **Lead Developer:** **POCHIRAJU KAILASH RAM MARKANDEYA SHARMA**

## 1. Demo Narrative: "Campus Chemical Building Fire"

### 0:00 — Opening & Operational Picture
1. Open `http://localhost:5173/command` (Command Center).
2. Point out:
   - Live KPI ribbon: Active Incidents, Critical Priority, Active Responders, Units Dispatched, People Affected.
   - Tactical radar map with pulsing emergency markers and unit apparatus locations.
   - Left incident feed with real-time severity badges.

### 0:25 — Ingesting Unstructured Emergency Signal
1. Click **"Report Emergency"** (or go to `/report`).
2. Click the preset: **"Campus Chemical Fire"**.
3. Point out text: *"Smoke and fire detected near Chemistry Building Block C. 12 students are trapped inside."*
4. Click **"Transmit Emergency Report"**.
5. Observe the live animated AI pipeline:
   - Entity extraction ➔ Spatial geofencing ➔ Casualty assessment ➔ Resource matching.
6. System generates code **`RQ-2026-0042`** (`CRITICAL`, `FIRE`, 12 affected, 3 trapped).

### 0:55 — Demonstrating Deduplication & Signal Fusion
1. Submit a second citizen report:
   *"Huge smoke and flames pouring from chemistry windows. Send fire engines!"*
2. Highlight the Deduplication Engine in action:
   - Detects 79%–94% similarity based on 0.02 km distance and semantic root overlap.
   - Corroborates the active incident without creating a distracting duplicate card.

### 1:20 — Intelligent Resource Candidate Ranking
1. Switch to Command Center and select `RQ-2026-0042`.
2. Review the Candidate Recommendation drawer:
   - `Fire Team #02` — 1.4 km, ETA 4 min, 98% Fit.
   - `Ambulance #04` — 2.1 km, ETA 6 min, 93% Fit.
   - `Medical Team #07` — 1.7 km, ETA 4 min.
3. Click **"Dispatch Recommended Units"**.
4. Observe the tactical route line appear on the map connecting units to the scene.

### 1:55 — Field Responder Mobile Terminal
1. Navigate to `/responder` (or switch role to *Capt. James Miller - Engine 02*).
2. Click **"1. Accept Assignment"** ➔ Status transitions to `ACCEPTED`.
3. Click **"2. Mark Unit En Route"** ➔ Status transitions to `EN_ROUTE`.
4. Click **"3. Mark Arrived On Scene"** ➔ Command center alerts units active on site.

### 2:35 — Resolution & Operational Synchronization
1. Click **"4. Complete Call & Return Available"** (or click Resolve in Command Center).
2. Confetti triggers! All units are released back to Available in the fleet inventory.
3. Response timeline marks all 8 stages complete.

### 2:50 — Quantified System Impact
1. Navigate to `/analytics`.
2. Highlight:
   - **64+ Lives Assisted**
   - **16 Duplicate Calls Consolidated**
   - **224 Minutes of Triage Time Saved**
   - Sub-3 minute average deployment velocity.
