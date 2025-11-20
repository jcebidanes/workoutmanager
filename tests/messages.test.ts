import request from 'supertest';
import knex from '../db/db.ts';
import app from '../server/server.ts';
import { registerTestUser } from './helpers.ts';

const seedClient = async (userId: number) => {
  const [clientId] = await knex('clients').insert({
    user_id: userId,
    name: 'Bob',
    email: 'bob@example.com',
  });
  return clientId;
};

describe('Client messages routes', () => {
  it('requires authentication to list messages', async () => {
    const response = await request(app).get('/clients/1/messages');
    expect(response.status).toBe(401);
  });

  it('validates client id on fetch', async () => {
    const { token } = await registerTestUser();
    const response = await request(app)
      .get('/clients/abc/messages')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(400);
  });

  it('allows listing and creating messages for an owned client', async () => {
    const { token, userId } = await registerTestUser();
    const clientId = await seedClient(userId);

    const create = await request(app)
      .post(`/clients/${clientId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Weekly check-in' });

    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ content: 'Weekly check-in' });

    const list = await request(app)
      .get(`/clients/${clientId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].content).toBe('Weekly check-in');
  });

  it('prevents creating messages without content', async () => {
    const { token, userId } = await registerTestUser();
    const clientId = await seedClient(userId);

    const response = await request(app)
      .post(`/clients/${clientId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });
});
