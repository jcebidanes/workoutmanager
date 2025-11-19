import request from 'supertest';
import app from '../server/server.ts';
import './setup.ts';

describe('Auth routes', () => {
  const credentials = { username: 'coach', password: 'super-secret' };

  it('registers a new user and returns a token', async () => {
    const response = await request(app)
      .post('/register')
      .send(credentials);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ username: credentials.username });
    expect(response.body.token).toBeDefined();
  });

  it('prevents duplicate usernames', async () => {
    await request(app).post('/register').send(credentials);

    const duplicate = await request(app).post('/register').send(credentials);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toMatch(/already exists/i);
  });

  it('logs in an existing user', async () => {
    await request(app).post('/register').send(credentials);

    const login = await request(app).post('/login').send(credentials);

    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ username: credentials.username });
    expect(login.body.token).toBeDefined();
  });

  it('rejects login attempts with invalid credentials', async () => {
    await request(app).post('/register').send(credentials);

    const login = await request(app)
      .post('/login')
      .send({ ...credentials, password: 'wrong-password' });

    expect(login.status).toBe(401);
    expect(login.body.error).toMatch(/invalid/i);
  });

  it('validates required fields on registration', async () => {
    const response = await request(app)
      .post('/register')
      .send({ username: 'no-password' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/required/i);
  });
});
