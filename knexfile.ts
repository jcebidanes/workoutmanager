
import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db/dev.sqlite3',
    },
    migrations: {
      directory: './db/migrations',
    },
    useNullAsDefault: true,
  },
};

export default config;
