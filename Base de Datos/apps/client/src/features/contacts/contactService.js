import { atom } from 'nanostores';
import { getPrivateKy } from '../auth/auth.service';

/** @typedef {import('./schemas').Contact} Contact */
/** @type {Contact[]} */
let contactsArray = [];
export const contactStore = atom(contactsArray);

/**
 * Crea un nuevo contacto
 * @param {object} payload
 * @param {string} payload.name - El nombre del contacto.
 * @param {string} payload.phone - El numero del contacto
 */
const addContact = async (payload) => {
  const privateKy = getPrivateKy();
  const data = await privateKy.post('/api/contact', { json: payload }).json();
  const contacts = contactStore.get();
  const updatedContacts = contacts.concat(data);
  contactStore.set(updatedContacts);
};

/**
 * Obtiene los contactos
 */
const getContacts = () => {
  return contactStore.get();
};

/**
 * Elimina un contacto.
 * @param {string} id - El id del contacto a eliminar.
 */
const deleteContact = async (id) => {
  const privateKy = getPrivateKy();
  await privateKy.delete(`/api/contact/${id}`);

  const contacts = contactStore.get();
  const updatedContacts = contacts.filter((contact) => contact.id !== id);
  contactStore.set(updatedContacts);
};

/**
 * Actualiza un contacto
 * @param {string} id - El id del contacto a actualizar
 * @param {object} payload - La information del contacto editado.
 * @param {string} payload.name - El nombre del contacto.
 * @param {string} payload.phone - El numero del contacto
 */
const updateContact = async (id, payload) => {
  const privateKy = getPrivateKy();
  const updatedContact = await privateKy.put(`/api/contact/${id}`, { json: payload }).json();

  const contacts = contactStore.get();
  const updatedContacts = contacts.map((contact) => {
    if (contact.id === id) {
      return {
        ...contact,
        name: updatedContact.name,
        phone: updatedContact.phone,
        isEditing: false,
      };
    } else {
      return contact;
    }
  });
  contactStore.set(updatedContacts);
};

/**
 * Obtener contactos del servidor
 */
const getContactsFromServer = async () => {
  const privateKy = getPrivateKy();
  const contacts = await privateKy.get('/api/contact').json();
  contactStore.set(contacts);
};

const contactsService = {
  addContact,
  getContacts,
  deleteContact,
  updateContact,
  getContactsFromServer,
};

export default contactsService;
