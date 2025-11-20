const { rawEnv } = require('./config/env.cjs');

const migrations = {
  directory: './db/migrations',
  loadExtensions: ['.ts'],
};

const buildSqlite = (filename) => ({
  client: 'sqlite3',
  connection: { filename },
  migrations,
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, done) => {
      conn.run('PRAGMA foreign_keys = ON', (err) => done(err, conn));
    },
  },
});

module.exports = {
  development: buildSqlite(rawEnv.SQLITE_DB_FILE || './db/dev.sqlite3'),
  test: buildSqlite(rawEnv.SQLITE_DB_FILE_TEST || './db/test.sqlite3'),
  production: rawEnv.DATABASE_URL
    ? {
      client: 'pg',
      connection: rawEnv.DATABASE_URL,
      migrations,
    }
    : buildSqlite(rawEnv.SQLITE_DB_FILE || './db/dev.sqlite3'),
};
