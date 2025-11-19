import { afterAll, beforeAll, beforeEach } from '@jest/globals';
import knex from '../db/db.ts';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

const tablesInDeleteOrder = [
  'client_sets',
  'client_exercises',
  'client_workouts',
  'client_metrics',
  'client_messages',
  'clients',
  'template_sets',
  'template_exercises',
  'workout_templates',
  'users',
] as const;

beforeAll(async () => {
  await knex.migrate.latest();
});

beforeEach(async () => {
  for (const table of tablesInDeleteOrder) {
    const exists = await knex.schema.hasTable(table);
    if (exists) {
      await knex(table).del();
    }
  }
});

afterAll(async () => {
  await knex.destroy();
});
