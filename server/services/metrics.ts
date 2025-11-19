import knex from './db.ts';
import { verifyClientOwnership } from './clients.ts';

export interface ClientMetric {
  id: number;
  clientId: number;
  name: string;
  value: number;
  unit?: string | null;
  recordedAt: string;
  createdAt: string;
}

export const listMetrics = async (clientId: number, userId: number): Promise<ClientMetric[]> => {
  const hasAccess = await verifyClientOwnership(clientId, userId);
  if (!hasAccess) {
    throw new Error('Client not found');
  }

  const rows = await knex('client_metrics')
    .where({ client_id: clientId })
    .orderBy('recorded_at', 'desc');

  return rows.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    value: row.value,
    unit: row.unit,
    recordedAt: row.recorded_at,
    createdAt: row.created_at,
  }));
};

export const createMetric = async (
  clientId: number,
  userId: number,
  payload: { name: string; value: number; unit?: string | null; recordedAt?: string },
): Promise<ClientMetric> => {
  const hasAccess = await verifyClientOwnership(clientId, userId);
  if (!hasAccess) {
    throw new Error('Client not found');
  }
  const recordedAt = payload.recordedAt ? new Date(payload.recordedAt) : new Date();
  const [id] = await knex('client_metrics').insert({
    client_id: clientId,
    name: payload.name,
    value: payload.value,
    unit: payload.unit ?? null,
    recorded_at: recordedAt,
  });
  const metric = await knex('client_metrics').where({ id }).first();
  return {
    id: metric.id,
    clientId: metric.client_id,
    name: metric.name,
    value: metric.value,
    unit: metric.unit,
    recordedAt: metric.recorded_at,
    createdAt: metric.created_at,
  };
};
