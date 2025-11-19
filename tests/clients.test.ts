import request from 'supertest';
import knex from '../db/db.ts';
import app from '../server/server.ts';
import './setup.ts';
import { registerTestUser } from './helpers.ts';

const buildClientGraph = async (userId: number) => {
  const [clientId] = await knex('clients').insert({
    user_id: userId,
    name: 'Alice',
    email: 'alice@example.com',
  });

  const [workoutId] = await knex('client_workouts').insert({
    client_id: clientId,
    template_id: null,
    name: 'Week 1',
    description: 'Initial assessment',
  });

  const [exerciseId] = await knex('client_exercises').insert({
    client_workout_id: workoutId,
    template_exercise_id: null,
    name: 'Goblet Squat',
    muscle_group: 'Legs',
    difficulty_level: 'Beginner',
    position: 1,
  });

  await knex('client_sets').insert([
    { client_exercise_id: exerciseId, set_number: 1, weight: 20, reps: 12 },
    { client_exercise_id: exerciseId, set_number: 2, weight: 22, reps: 10 },
  ]);
};

describe('Client routes', () => {
  it('requires authentication to list clients', async () => {
    const response = await request(app).get('/clients');
    expect(response.status).toBe(401);
  });

  it('returns an empty array when there are no clients', async () => {
    const { token } = await registerTestUser();
    const response = await request(app)
      .get('/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns clients with workouts, exercises, and sets', async () => {
    const { token, userId } = await registerTestUser();
    await buildClientGraph(userId);

    const response = await request(app)
      .get('/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    const [client] = response.body;
    expect(client).toMatchObject({
      name: 'Alice',
      workouts: [
        {
          name: 'Week 1',
          exercises: [
            {
              name: 'Goblet Squat',
              sets: [
                { setNumber: 1, weight: 20, reps: 12 },
                { setNumber: 2, weight: 22, reps: 10 },
              ],
            },
          ],
        },
      ],
    });
  });
});
