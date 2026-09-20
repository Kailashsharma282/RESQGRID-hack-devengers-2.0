const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP Error ${res.status}`);
  }
  return data;
}

export const api = {
  // Incidents
  getIncidents: (params?: { category?: string; severity?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<{ success: boolean; data: any[] }>(`/incidents?${q}`);
  },

  getIncidentById: (id: string) => {
    return fetchJson<{ success: boolean; data: any }>(`/incidents/${id}`);
  },

  verifyIncident: (id: string, operatorId?: string, notes?: string) => {
    return fetchJson<{ success: boolean; data: any }>(`/incidents/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ operatorId, notes }),
    });
  },

  dispatchToIncident: (id: string, resourceIds: string[], operatorId?: string, notes?: string) => {
    return fetchJson<{ success: boolean; data: any }>(`/incidents/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({ resourceIds, operatorId, notes }),
    });
  },

  resolveIncident: (id: string, operatorId?: string, resolutionNotes?: string) => {
    return fetchJson<{ success: boolean; data: any }>(`/incidents/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ operatorId, resolutionNotes }),
    });
  },

  mergeIncidents: (primaryId: string, sourceIncidentId: string, operatorId?: string) => {
    return fetchJson<{ success: boolean; data: any }>(`/incidents/${primaryId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ sourceIncidentId, operatorId }),
    });
  },

  reanalyzeIncident: (id: string) => {
    return fetchJson<{ success: boolean; data: any; aiAnalysis: any }>(`/incidents/${id}/reanalyze`, {
      method: 'POST',
    });
  },

  // Reports
  submitReport: (payload: {
    text: string;
    category?: string;
    latitude: number;
    longitude: number;
    address?: string;
    reporterId?: string;
    mediaUrl?: string;
    source?: string;
  }) => {
    return fetchJson<{
      success: boolean;
      isDuplicate: boolean;
      incidentCode: string;
      incidentId: string;
      incident?: any;
      aiAnalysis: any;
      duplicateAnalysis?: any;
      recommendedResources?: any[];
    }>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getReports: () => {
    return fetchJson<{ success: boolean; data: any[] }>('/reports');
  },

  // Resources
  getResources: (params?: { type?: string; status?: string; organization?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<{ success: boolean; data: any[] }>(`/resources?${q}`);
  },

  getNearbyResources: (lat: number, lon: number, radiusKm = 10, type?: string) => {
    const q = new URLSearchParams({ lat: String(lat), lon: String(lon), radiusKm: String(radiusKm), ...(type ? { type } : {}) }).toString();
    return fetchJson<{ success: boolean; data: any[] }>(`/resources/nearby?${q}`);
  },

  updateResource: (id: string, data: any) => {
    return fetchJson<{ success: boolean; data: any }>(`/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Dispatches
  getDispatches: (params?: { status?: string; resourceId?: string; incidentId?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<{ success: boolean; data: any[] }>(`/dispatches?${q}`);
  },

  updateDispatchStatus: (id: string, status: string, notes?: string) => {
    return fetchJson<{ success: boolean; data: any }>(`/dispatches/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, responderNotes: notes }),
    });
  },

  // Notifications
  getNotifications: (userId?: string) => {
    const q = userId ? `?userId=${userId}` : '';
    return fetchJson<{ success: boolean; data: any[] }>(`/notifications${q}`);
  },

  markNotificationRead: (id: string) => {
    return fetchJson<{ success: boolean; data: any }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllNotificationsRead: () => {
    return fetchJson<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  },

  // Analytics
  getAnalyticsOverview: () => {
    return fetchJson<{ success: boolean; data: any }>('/analytics/overview');
  },

  getAuditLogs: (limit = 50) => {
    return fetchJson<{ success: boolean; data: any[] }>(`/analytics/audit-logs?limit=${limit}`);
  },

  // Demo Simulation
  runDemoScenario: () => {
    return fetchJson<{ success: boolean; message: string; data: any }>('/demo/run-scenario', { method: 'POST' });
  },

  demoStepDuplicate: () => {
    return fetchJson<{ success: boolean; data: any }>('/demo/step-duplicate', { method: 'POST' });
  },

  demoStepVerify: () => {
    return fetchJson<{ success: boolean; data: any }>('/demo/step-verify', { method: 'POST' });
  },

  demoStepDispatch: () => {
    return fetchJson<{ success: boolean; incident: any; dispatches: any[] }>('/demo/step-dispatch', { method: 'POST' });
  },

  demoStepArrived: () => {
    return fetchJson<{ success: boolean; data: any }>('/demo/step-arrived', { method: 'POST' });
  },

  demoStepResolve: () => {
    return fetchJson<{ success: boolean; data: any }>('/demo/step-resolve', { method: 'POST' });
  },

  // Users / Auth
  getUsers: () => {
    return fetchJson<{ success: boolean; data: any[] }>('/auth/users');
  },

  // Storage / Uploads
  uploadMedia: async (file: File, folder = 'emergency-media') => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/storage/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Upload failed with HTTP ${res.status}`);
    }
    return data;
  },
};
