import { Router } from 'express';
import {
  createContactRouteSchema,
  deleteContactRouteSchema,
  updateContactRouteSchema,
} from './contact.routes.schemas.js';
import contactRepository from './contact.repository.js';
const contactRouter = Router();

// Ruta para crear un contacto
contactRouter.post('/', async (req, res) => {
  // 1. Validar el requerimiento
  const body = createContactRouteSchema.body.parse(req.body);

  // 2. Guardarlo en db
  const createdContact = await contactRepository.createContact({
    name: body.name,
    phone: body.phone,
    userId: req.user.id,
  });

  // 3. Responder con el contacto guardado
  return res.status(201).json(createdContact);
});

// Ruta para obtener los contactos del usuario
contactRouter.get('/', async (req, res) => {
  // 1. Obtener los contactos en db
  const contacts = await contactRepository.getContacts(req.user.id);

  // 2. Responder con los contactos
  return res.status(200).json(contacts);
});

// Ruta para actualizar un contacto
contactRouter.put('/:id', async (req, res) => {
  // 1. Validar el requerimiento
  const body = updateContactRouteSchema.body.parse(req.body);
  const params = updateContactRouteSchema.params.parse(req.params);

  // 2. Guardarlo en db
  const updatedContact = await contactRepository.updateContact({
    id: params.id,
    name: body.name,
    phone: body.phone,
    userId: req.user.id,
  });

  // 3. Responder con el contacto actualizado
  return res.status(200).json(updatedContact);
});

// Ruta para eliminar un contacto
contactRouter.delete('/:id', async (req, res) => {
  // 1. Validar el requerimiento
  const params = deleteContactRouteSchema.params.parse(req.params);

  // 2. Borrarlo en db
  const deletedContact = await contactRepository.deleteContact({
    id: params.id,
    userId: req.user.id,
  });

  // 3. Responder con el contacto eliminado
  return res.status(200).json(deletedContact);
});

export default contactRouter;
