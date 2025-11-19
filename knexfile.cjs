const base = {
  client: 'sqlite3',
  connection: {
    filename: './db/dev.sqlite3',
  },
  migrations: {
    directory: './db/migrations',
    loadExtensions: ['.ts'],
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, done) => {
      conn.run('PRAGMA foreign_keys = ON', (err) => done(err, conn));
    },
  },
};

const config = {
  development: base,
  test: {
    ...base,
    connection: {
      filename: './db/test.sqlite3',
    },
  },
};

module.exports = config;
