import config from ".";

const { db } = config;

module.exports = {
  migrationsTable: "pgmigrations",
  dir: "migrations",
  databaseUrl: {
    host: db.host,
    port: db.port,
    database: db.database,
    user: db.user,
    password: db.password,
  },
};
