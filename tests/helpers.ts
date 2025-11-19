import request from 'supertest';
import app from '../server/server.ts';

export const registerTestUser = async () => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const credentials = { username: `tester-${unique}`, password: 'super-secret' };

  const response = await request(app)
    .post('/register')
    .send(credentials);

  if (response.status !== 201) {
    throw new Error(`Failed to register test user: ${response.status} ${response.text}`);
  }

  return {
    token: response.body.token as string,
    userId: response.body.user.id as number,
    credentials,
  };
};
