import request from 'supertest';
import knex from '../db/db.ts';
import app from '../server/server.ts';
import { registerTestUser } from './helpers.ts';

const seedClient = async (userId: number) => {
  const [clientId] = await knex('clients').insert({
    user_id: userId,
    name: 'Charlie',
    email: 'charlie@example.com',
  });
  return clientId;
};

describe('Client metrics routes', () => {
  it('requires authentication to list metrics', async () => {
    const response = await request(app).get('/clients/1/metrics');
    expect(response.status).toBe(401);
  });

  it('validates client id on fetch', async () => {
    const { token } = await registerTestUser();
    const response = await request(app)
      .get('/clients/not-a-number/metrics')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(400);
  });

  it('allows listing and creating metrics for an owned client', async () => {
    const { token, userId } = await registerTestUser();
    const clientId = await seedClient(userId);

    const create = await request(app)
      .post(`/clients/${clientId}/metrics`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Weight', value: 78.5, unit: 'kg' });

    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ name: 'Weight', value: 78.5 });

    const list = await request(app)
      .get(`/clients/${clientId}/metrics`)
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ name: 'Weight', value: 78.5 });
  });

  it('validates metric payload before creating', async () => {
    const { token, userId } = await registerTestUser();
    const clientId = await seedClient(userId);

    const response = await request(app)
      .post(`/clients/${clientId}/metrics`)
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'abc' });

    expect(response.status).toBe(400);
  });
});
