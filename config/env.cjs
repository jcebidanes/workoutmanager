const { config: loadEnv } = require('dotenv-flow');
const { z } = require('zod');

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
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

const env = parsed.data;

const buildSqliteConfig = (filename) => ({
  client: 'sqlite3',
  connection: { filename },
  useNullAsDefault: true,
  migrations: {
    directory: './db/migrations',
    loadExtensions: ['.ts'],
  },
  pool: {
    afterCreate: (conn, done) => {
      conn.run('PRAGMA foreign_keys = ON', (err) => done(err, conn));
    },
  },
});

const databaseConfig = env.DATABASE_URL
  ? {
    client: 'pg',
    connection: env.DATABASE_URL,
    migrations: {
      directory: './db/migrations',
      loadExtensions: ['.ts'],
    },
  }
  : buildSqliteConfig(env.NODE_ENV === 'test' ? env.SQLITE_DB_FILE_TEST : env.SQLITE_DB_FILE);

const appConfig = {
  env: env.NODE_ENV,
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
};

module.exports = {
  rawEnv: env,
  appConfig,
  databaseConfig,
};
