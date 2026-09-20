/**
 * Resilient JSON parsing utility for dual-database compatibility:
 * - SQLite stores JSON arrays and objects as strings (schema.prisma).
 * - PostgreSQL / Neon DB stores them as native JSON/JSONB (schema.neon.prisma),
 *   which Prisma Client returns directly as parsed JavaScript objects or arrays.
 *
 * This utility guarantees that whether a field is stringified or already parsed,
 * it returns the expected data structure without throwing runtime SyntaxErrors.
 */
export function safeJsonParse<T = any>(value: any, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  // Already parsed as object/array from PostgreSQL / Neon JSONB
  if (typeof value === 'object') {
    return value as T;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return fallback;
    }
  }

  return fallback;
}
