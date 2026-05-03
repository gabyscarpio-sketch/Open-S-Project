import db from './index.js';

/**
 * Crea la tabla de usuarios en la base de datos
 * @returns {void}
 */
const createUsersTable = async () => {
  await db.query(`
    CREATE TABLE users (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT UNIQUE NOT NULL,
      email_verified BOOLEAN DEFAULT false
    )
  `);
  console.log('Tabla de usuarios creada!');
};

/**
 * Crea la tabla de contactos en la base de datos
 * @returns {void}
 */
const createContactsTable = async () => {
  await db.query(`
    CREATE TABLE contacts (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log('Tabla de contactos creada!');
};

/**
 * Crea la tabla de sesiones en la base de datos
 * @returns {void}
 */
const createSessionTable = async () => {
  await db.query(`
    CREATE TABLE sessions (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      jwtid TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log('Tabla de sesiones creada!');
};

/**
 * Elimina las tablas de la base de datos para reiniciar el estado de la base de datos
 * @returns {void}
 */
const resetDb = async () => {
  await db.query('DROP TABLE IF EXISTS contacts');
  await db.query('DROP TABLE IF EXISTS sessions');
  await db.query('DROP TABLE IF EXISTS users');
  console.log('Tablas eliminadas');
};

/**
 * Crea las tablas de la base de datos
 * @returns {void}
 * @description Esta función se encarga de crear las tablas de la base de datos, primero elimina las tablas existentes para evitar errores de tablas ya existentes, luego crea las tablas necesarias para la aplicación.
 */
export const createTables = async () => {
  await db.connect();

  await resetDb();
  await createUsersTable();
  await createContactsTable();
  await createSessionTable();

  await db.end();
  process.exit(1);
  console.log('Tablas creadas');
};

createTables();
