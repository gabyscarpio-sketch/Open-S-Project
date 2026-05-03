import db from '../../db/index.js';

/** @typedef {import('./contact.schemas.js').Contact} Contact */

/**
 * Crea un contacto en la base de datos
 * @param {Object} payload
 * @param {Contact['name']} payload.name - El nombre del contacto
 * @param {Contact['phone']} payload.phone - El numero del contacto
 * @param {Contact['user_id']} payload.userId - El id del usuario que crea el contacto
 * @returns {Promise<Contact>} El contacto creado
 */
const createContact = async ({ name, phone, userId }) => {
  const res = await db.query(
    `INSERT INTO contacts (name, phone, user_id) VALUES ($1, $2, $3) RETURNING *`,
    [name, phone, userId],
  );
  const createdContact = res.rows[0];
  return createdContact;
};

/**
 * Obtienes los contactos del usuario
 * @param {Contact['user_id']} userId - El id del usuario
 * @returns {Promise<Contact[]>} Los contactos del usuario
 */
const getContacts = async (userId) => {
  const res = await db.query(`SELECT * FROM contacts WHERE user_id = $1`, [userId]);
  const contacts = res.rows;
  return contacts;
};

/**
 * Actualiza un contacto en la base de datos
 * @param {Object} payload
 * @param {Contact['id']} payload.id - El id del contacto
 * @param {Contact['name']} payload.name - El nombre del contacto
 * @param {Contact['phone']} payload.phone - El numero del contacto
 * @param {Contact['user_id']} payload.userId - El id del usuario que crea el contacto
 * @returns {Promise<Contact>} El contacto actualizado
 */
const updateContact = async ({ id, name, phone, userId }) => {
  const res = await db.query(
    `
    UPDATE contacts
    SET name = $1, phone = $2
    WHERE id = $3 AND user_id = $4
    RETURNING *
    `,
    [name, phone, id, userId],
  );
  const updatedContact = res.rows[0];
  return updatedContact;
};

/**
 * Elimina un contacto en la base de datos
 * @param {Object} payload
 * @param {Contact['id']} payload.id - El id del contacto
 * @param {Contact['user_id']} payload.userId - El id del usuario que crea el contacto
 * @returns {Promise<Contact>} El contacto eliminado
 */
const deleteContact = async ({ id, userId }) => {
  const res = await db.query('DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING *', [
    id,
    userId,
  ]);
  const deletedContact = res.rows[0];
  return deletedContact;
};

const contactRepository = { createContact, getContacts, updateContact, deleteContact };
export default contactRepository;
