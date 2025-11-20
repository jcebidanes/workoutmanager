import { config as loadEnv } from 'dotenv-flow';
<<<<<<< HEAD
import type { Database } from 'sqlite3';
=======
>>>>>>> 47c8e951d5f2487619abac58ca5e1c3a309cc98f
import { z } from 'zod';

loadEnv({
  default_node_env: 'development',
  silent: true,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  DATABASE_URL: z.string().optional(),
  SQLITE_DB_FILE: z.string().default('./db/dev.sqlite3'),
  SQLITE_DB_FILE_TEST: z.string().default('./db/test.sqlite3'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
<<<<<<< HEAD
  console.error('Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Invalid environment variables. Please check the above output for details on which variables are invalid or missing.');
=======
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
>>>>>>> 47c8e951d5f2487619abac58ca5e1c3a309cc98f
}

const env = parsed.data;

export const appConfig = {
  env: env.NODE_ENV,
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
};

const migrations = {
  directory: './db/migrations',
  loadExtensions: ['.ts'],
};

const buildSqliteConfig = (filename: string) => ({
  client: 'sqlite3' as const,
  connection: { filename },
  useNullAsDefault: true,
  migrations,
  pool: {
<<<<<<< HEAD
    afterCreate: (conn: Database, done: (err: Error | null, conn: Database) => void) => {
=======
    afterCreate: (conn: any, done: (err: Error | null, conn: any) => void) => {
>>>>>>> 47c8e951d5f2487619abac58ca5e1c3a309cc98f
      conn.run('PRAGMA foreign_keys = ON', (err: Error | null) => done(err, conn));
    },
  },
});

export const databaseConfig = env.DATABASE_URL
  ? {
    client: 'pg' as const,
    connection: env.DATABASE_URL,
    migrations,
  }
  : buildSqliteConfig(env.NODE_ENV === 'test' ? env.SQLITE_DB_FILE_TEST : env.SQLITE_DB_FILE);

export const rawEnv = env;
