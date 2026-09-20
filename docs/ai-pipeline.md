# AI Intelligence Pipeline & Deduplication — ResQGrid

> **Hack Devengers 2.0**  
> **Lead Developer:** **POCHIRAJU KAILASH RAM MARKANDEYA SHARMA**

## 1. Multi-Modal Intake & Zod Validation

ResQGrid implements schema-guaranteed AI processing. Every extraction must satisfy the `AIAnalysisSchema`:

```typescript
export const AIAnalysisSchema = z.object({
  category: z.nativeEnum(IncidentCategory),
  severity: z.nativeEnum(IncidentSeverity),
  title: z.string().min(3).max(120),
  summary: z.string().min(10).max(500),
  affectedPeople: z.number().int().nonnegative(),
  vulnerablePeople: z.number().int().nonnegative(),
  requiredResources: z.array(z.nativeEnum(ResourceType)),
  confidenceScore: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  reasoning: z.string().min(10),
  priorityScore: z.number().min(0).max(100),
});
```

## 2. 100% Deterministic Fallback Mode

To ensure zero judging failures or network bottlenecks:
- When `LLM_API_KEY` is not provided or provider is set to `mock`, ResQGrid executes a high-fidelity deterministic NLP pipeline.
- Extracts keywords (e.g. `solvent`, `trapped`, `smoke`, `cardiac`, `submerged`, `arcing`).
- Quantifies trapped and vulnerable individuals from linguistic patterns (`12 students`, `two elderly`, `couple`).
- Automatically assigns required resources and confidence weights.

## 3. Deduplication Pipeline

When multiple citizens report the same emergency from different angles:
1. **Haversine Distance**:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   Filters candidates within a 2.5 km threshold.
2. **Temporal Window**: Assesses delta within a 12-hour window.
3. **Stemmed Root Overlap**: Extracts 4-character root stems to bridge morphological variations (e.g., `chemical` and `chemistry`).
4. **Weighted Score**:
   $$\text{Similarity} = 0.35 \cdot \text{Geo} + 0.35 \cdot \text{Semantic} + 0.20 \cdot \text{Category} + 0.10 \cdot \text{Temporal}$$
   If $\ge 65\%$, the report is fused into the existing incident, updating confidence and corroborating casualty counts.
