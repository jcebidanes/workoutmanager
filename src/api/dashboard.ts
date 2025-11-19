import type {
  WorkoutTemplate,
  ClientRecord,
  ClientWorkout,
  TemplateFormState,
  ClientFormState,
  ClientMessage,
  ClientMetric,
} from '../types/dashboard';

const API_BASE_URL = 'http://localhost:3001';

const request = async <T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => 'Request failed');
    throw new Error(message || 'Request failed');
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
};

export const fetchTemplates = (token: string | null) => request<WorkoutTemplate[]>('/templates', token);

export const fetchClients = (token: string | null) => request<ClientRecord[]>('/clients', token);

export const createTemplate = (token: string | null, payload: TemplateFormState) => request<WorkoutTemplate>('/templates', token, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const createClient = (token: string | null, payload: ClientFormState) => request('/clients', token, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const assignTemplate = (token: string | null, clientId: string | number, templateId: number) => request(`/clients/${clientId}/assign-template`, token, {
  method: 'POST',
  body: JSON.stringify({ templateId }),
});

export const updateClientWorkout = (token: string | null, workout: ClientWorkout) => request(`/client-workouts/${workout.id}`, token, {
  method: 'PUT',
  body: JSON.stringify({
    name: workout.name,
    description: workout.description,
    exercises: workout.exercises,
  }),
});

export const fetchClientMessages = (token: string | null, clientId: number) => request<ClientMessage[]>(
  `/clients/${clientId}/messages`,
  token,
);

export const createClientMessage = (token: string | null, clientId: number, content: string) => request<ClientMessage>(
  `/clients/${clientId}/messages`,
  token,
  {
    method: 'POST',
    body: JSON.stringify({ content }),
  },
);

export const fetchClientMetrics = (token: string | null, clientId: number) => request<ClientMetric[]>(
  `/clients/${clientId}/metrics`,
  token,
);

export const createClientMetric = (
  token: string | null,
  clientId: number,
  payload: { name: string; value: number; unit?: string; recordedAt?: string },
) => request<ClientMetric>(
  `/clients/${clientId}/metrics`,
  token,
  {
    method: 'POST',
    body: JSON.stringify(payload),
  },
);
