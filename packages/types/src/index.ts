export enum UserRole {
  CITIZEN = 'CITIZEN',
  OPERATOR = 'OPERATOR',
  RESPONDER = 'RESPONDER',
  ADMIN = 'ADMIN'
}

export enum IncidentCategory {
  FIRE = 'FIRE',
  FLOOD = 'FLOOD',
  MEDICAL = 'MEDICAL',
  ACCIDENT = 'ACCIDENT',
  STRUCTURAL = 'STRUCTURAL',
  ELECTRICAL = 'ELECTRICAL',
  SECURITY = 'SECURITY',
  MISSING_PERSON = 'MISSING_PERSON',
  HAZMAT = 'HAZMAT',
  OTHER = 'OTHER'
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum IncidentStatus {
  REPORTED = 'REPORTED',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  DISPATCHING = 'DISPATCHING',
  RESPONDING = 'RESPONDING',
  ON_SCENE = 'ON_SCENE',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum ResourceType {
  AMBULANCE = 'AMBULANCE',
  FIRE_TRUCK = 'FIRE_TRUCK',
  RESCUE_BOAT = 'RESCUE_BOAT',
  MEDICAL_TEAM = 'MEDICAL_TEAM',
  FIRE_TEAM = 'FIRE_TEAM',
  POLICE_TEAM = 'POLICE_TEAM',
  VOLUNTEER_TEAM = 'VOLUNTEER_TEAM',
  FOOD = 'FOOD',
  WATER = 'WATER',
  GENERATOR = 'GENERATOR',
  SHELTER = 'SHELTER',
  FIRST_AID = 'FIRST_AID',
  OTHER = 'OTHER'
}

export enum ResourceStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE = 'EN_ROUTE',
  ON_SCENE = 'ON_SCENE',
  UNAVAILABLE = 'UNAVAILABLE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum DispatchStatus {
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  ON_SCENE = 'ON_SCENE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Incident {
  id: string;
  incidentCode: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  address: string;
  affectedPeople: number;
  vulnerablePeople: number;
  confidenceScore: number;
  priorityScore?: number;
  source: string;
  aiSummary?: string | null;
  aiReasoning?: string | null;
  createdBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string | null;
  reports?: IncidentReport[];
  dispatches?: Dispatch[];
}

export interface IncidentReport {
  id: string;
  incidentId: string;
  reporterId?: string | null;
  text: string;
  mediaUrl?: string | null;
  source: string;
  latitude: number;
  longitude: number;
  extractedData?: string | null; // JSON string
  confidenceScore: number;
  createdAt: Date | string;
  reporter?: User | null;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  capacity: number;
  latitude: number;
  longitude: number;
  organization: string;
  contact: string;
  capabilities: string[]; // JSON array
  metadata?: Record<string, any> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  dispatches?: Dispatch[];
}

export interface Dispatch {
  id: string;
  incidentId: string;
  resourceId: string;
  assignedBy?: string | null;
  status: DispatchStatus;
  assignedAt: Date | string;
  acceptedAt?: Date | string | null;
  arrivedAt?: Date | string | null;
  completedAt?: Date | string | null;
  etaMinutes: number;
  distanceKm: number;
  notes?: string | null;
  incident?: Incident;
  resource?: Resource;
}

export interface Notification {
  id: string;
  userId?: string | null;
  incidentId?: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any> | null;
  createdAt: Date | string;
}

// AI Analysis Structured Output
export interface AIAnalysisResult {
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  summary: string;
  affectedPeople: number;
  vulnerablePeople: number;
  requiredResources: ResourceType[];
  confidenceScore: number;
  keywords: string[];
  reasoning: string;
  priorityScore: number; // 0-100
}

// Duplicate Detection Model
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  primaryIncidentId?: string;
  confidence: number;
  similarityPercentage: number;
  reasons: {
    spatialDistanceKm: number;
    temporalDeltaMinutes: number;
    categoryMatch: boolean;
    semanticSimilarity: number;
  };
}

// Resource Matching Candidate
export interface ResourceMatchCandidate {
  resource: Resource;
  matchingScore: number; // 0-100
  distanceKm: number;
  etaMinutes: number;
  capabilityMatchPercentage: number;
  availabilityScore: number;
  recommended: boolean;
  reasoning: string;
}

// Analytics Overview
export interface AnalyticsOverview {
  activeIncidents: number;
  criticalIncidents: number;
  respondersActive: number;
  resourcesDispatched: number;
  peopleAffectedTotal: number;
  peopleAssistedTotal: number;
  resolvedToday: number;
  avgDispatchTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  duplicateReportsMerged: number;
  estimatedTimeSavedMinutes: number;
  incidentsByCategory: { category: IncidentCategory; count: number }[];
  incidentsBySeverity: { severity: IncidentSeverity; count: number }[];
  hourlyActivity: { hour: string; count: number }[];
  resourceUtilization: { type: ResourceType; total: number; inUse: number }[];
}

// WebSocket Event Names
export const WS_EVENTS = {
  INCIDENT_CREATED: 'incident.created',
  INCIDENT_UPDATED: 'incident.updated',
  INCIDENT_SEVERITY_CHANGED: 'incident.severityChanged',
  INCIDENT_MERGED: 'incident.merged',
  REPORT_RECEIVED: 'report.received',
  RESOURCE_UPDATED: 'resource.updated',
  RESOURCE_ASSIGNED: 'resource.assigned',
  DISPATCH_CREATED: 'dispatch.created',
  DISPATCH_UPDATED: 'dispatch.updated',
  RESPONDER_ACCEPTED: 'responder.accepted',
  RESPONDER_ARRIVED: 'responder.arrived',
  INCIDENT_RESOLVED: 'incident.resolved',
  NOTIFICATION_CREATED: 'notification.created',
  AUDIT_CREATED: 'audit.created'
} as const;
