import { Router } from 'express';
import { createUserRouteSchema } from './user.routes.schemas.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from './user.repository.js';
import nodemailerService from '../../services/nodemailer.js';
import { CLIENT_ENDPOINT } from '../../config.js';
const userRouter = Router();

userRouter.post('/', async (req, res, next) => {
  let createdUser = null;
  try {
    // 1. Validar el requerimiento
    const body = createUserRouteSchema.body.parse(req.body);
    console.log('AJA1');
    // 2. Encriptar la contraseña
    const passwordHash = await bcrypt.hash(body.password, 10);
    console.log('AJA2');
    // 3. Guardar en la base datos
    createdUser = await userRepository.createUser({ email: body.email, passwordHash });
    console.log('AJA3');
    // 4. Enviar el correo de validación
    const emailToken = jwt.sign(
      { id: createdUser.id, email: createdUser.email },
      process.env.EMAIL_TOKEN_SECRET,
    );

    console.log('AJA');

    await nodemailerService.sendMail({
      to: createdUser.email,
      html: `
        <div>
          <h1>Verifica tu correo</h1>
          <a href="${CLIENT_ENDPOINT}/verify/${emailToken}">Verificar</a>
        </div>
        `,
    });

    // 5. Responder con el usuario creado
    res.status(201).json(createdUser);
  } catch (error) {
    // Si el usuario fue creado pero hubo un error en el proceso, eliminar el usuario creado para evitar inconsistencias
    if (createdUser) await userRepository.deleteUserById(createdUser.id);

    // Responder con un error genérico
    next(error);
  }
});

export default userRouter;
