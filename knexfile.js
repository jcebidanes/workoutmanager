const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db/dev.sqlite3',
    },
    migrations: {
      directory: './db/migrations',
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', (err) => done(err, conn));
      },
    },
  },
};

export default config;
