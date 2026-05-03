import db from '../../db/index.js';

/** @typedef {import('./auth.schemas.js').Session} Session */

/**
 * Crea una session en la base de datos
 * @param {Object} payload - El payload para crear la session
 * @param {Session['jwtid']} payload.jwtid - El id del token
 * @param {Session['user_id']} payload.userId - El id del usuario
 * @returns {Session} La session creada
 */
const createSession = async ({ jwtid, userId }) => {
  const res = await db.query('INSERT INTO sessions (jwtid, user_id) VALUES ($1,$2) RETURNING *', [
    jwtid,
    userId,
  ]);
  const createdSession = res.rows[0];
  return createdSession;
};

/**
 * Busca una session por el id del refresh token
 * @param {Object} payload - El payload para buscar la session
 * @param {Session['jwtid']} payload.jwtid - El id del token
 * @returns {Promise<Session>} La session encontrada
 */
const findSessionByJwtId = async ({ jwtid }) => {
  const res = await db.query('SELECT * FROM sessions WHERE jwtid = $1', [jwtid]);
  const session = res.rows[0];
  return session;
};

/**
 * Actualiza el id del token de la session
 * @param {Object} payload
 * @param {Session['jwtid']} payload.jwtid - El id del token
 * @param {Session['id']} payload.id - El id de la session a actualizar
 * @returns {Promise<void>}
 */
const updateSessionJwtId = async ({ jwtid, id }) => {
  await db.query(
    `
    UPDATE sessions
    SET jwtid = $1
    WHERE id = $2
  `,
    [jwtid, id],
  );
};

/**
 * Elimina una session por el id
 * @param {string} id - El id de la session a eliminar
 * @returns {Promise<void>}
 */
const deleteSession = async (id) => {
  await db.query('DELETE FROM sessions WHERE id = $1', [id]);
};

const authRepository = { createSession, findSessionByJwtId, updateSessionJwtId, deleteSession };
export default authRepository;
