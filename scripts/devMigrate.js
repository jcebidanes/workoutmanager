import { register } from 'ts-node';
register({
  transpileOnly: true,
  compilerOptions: {
    module: 'esnext',
    moduleResolution: 'nodenext',
  },
});

import knex from 'knex';
import knexConfig from '../knexfile.js';

const environment = process.env.NODE_ENV ?? 'development';
const config = knexConfig[environment];

if (!config) {
  console.error(`No knex configuration found for environment "${environment}"`);
  process.exit(1);
}

const runMigrations = async () => {
  const db = knex(config);
  try {
    await db.migrate.latest();
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
};

await runMigrations();
