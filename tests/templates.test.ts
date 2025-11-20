import request from 'supertest';
import knex from '../db/db.ts';
import app from '../server/server.ts';
import { registerTestUser } from './helpers.ts';

describe('Template routes', () => {
  it('requires authentication to list templates', async () => {
    const response = await request(app).get('/templates');
    expect(response.status).toBe(401);
  });

  it('returns templates with nested exercises and sets for the authenticated user', async () => {
    const { token, userId } = await registerTestUser();

    const [templateId] = await knex('workout_templates').insert({
      user_id: userId,
      name: 'Upper Body',
      description: 'Push focus',
    });

    const [exerciseId] = await knex('template_exercises').insert({
      template_id: templateId,
      name: 'Bench Press',
      muscle_group: 'Chest',
      difficulty_level: 'Intermediate',
      position: 1,
    });

    await knex('template_sets').insert([
      { exercise_id: exerciseId, set_number: 1, weight: 80, reps: 8 },
      { exercise_id: exerciseId, set_number: 2, weight: 80, reps: 8 },
    ]);

    const response = await request(app)
      .get('/templates')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      name: 'Upper Body',
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { setNumber: 1, weight: 80, reps: 8 },
            { setNumber: 2, weight: 80, reps: 8 },
          ],
        },
      ],
    });
  });
});
