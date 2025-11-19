import knex from './db.ts';
import { verifyClientOwnership } from './clients.ts';

export interface ClientMessage {
  id: number;
  clientId: number;
  content: string;
  createdAt: string;
}

export const listMessages = async (clientId: number, userId: number): Promise<ClientMessage[]> => {
  const hasAccess = await verifyClientOwnership(clientId, userId);
  if (!hasAccess) {
    throw new Error('Client not found');
  }

  const rows = await knex('client_messages')
    .where({ client_id: clientId })
    .orderBy('created_at', 'desc');

  return rows.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    content: row.content,
    createdAt: row.created_at,
  }));
};

export const createMessage = async (
  clientId: number,
  userId: number,
  content: string,
): Promise<ClientMessage> => {
  const hasAccess = await verifyClientOwnership(clientId, userId);
  if (!hasAccess) {
    throw new Error('Client not found');
  }

  const [id] = await knex('client_messages').insert({
    client_id: clientId,
    content,
  });

  const message = await knex('client_messages').where({ id }).first();
  return {
    id: message.id,
    clientId: message.client_id,
    content: message.content,
    createdAt: message.created_at,
  };
};
