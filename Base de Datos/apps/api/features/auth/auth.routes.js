import { Router } from 'express';
import { loginRouteSchema, verifyRouteSchema } from './auth.routes.schemas.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../user/user.repository.js';
import authRepository from './auth.repository.js';
import nodemailerService from '../../services/nodemailer.js';
import { authenticate } from './auth.middlewares.js';
const authRouter = Router();

// Ruta para iniciar sesión
authRouter.post('/login', async (req, res) => {
  // 1. Validamos la data recibida
  const body = loginRouteSchema.body.parse(req.body);

  // 2. Buscar el posible usuario en la base de datos
  const user = await userRepository.findUserByEmail(body.email);

  if (!user || !user?.email_verified) {
    return res.status(403).json({ error: 'Usuario o contraseña invalida' });
  }

  // 3. Comprobar la contraseña
  const isPasswordCorrect = await bcrypt.compare(body.password, user.password_hash);

  if (!isPasswordCorrect) {
    return res.status(403).json({ error: 'Usuario o contraseña invalida' });
  }

  // 4. Crear token para cookies
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '30m',
    },
  );

  const refreshTokenId = crypto.randomUUID();

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
      jwtid: refreshTokenId,
    },
  );

  await authRepository.createSession({ jwtid: refreshTokenId, userId: user.id });

  const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  res.cookie('refresh_token', refreshToken, {
    expires: expireDate,
    httpOnly: true,
    secure: process.env.ENV_MODE === 'prod',
    sameSite: 'strict',
  });

  return res.status(201).json({ accessToken, userId: user.id, email: user.email });
});

// Ruta para verificar el correo del usuario
authRouter.patch('/verify', async (req, res, next) => {
  // 1. Verificar el body
  const { token } = verifyRouteSchema.body.parse(req.body);

  try {
    // 2. Verificar el token
    const decodedToken = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);

    // 3. Buscar el usuario asociado al token
    const user = await userRepository.findUserByEmail(decodedToken.email);

    // 4. Verificar si el usuario ya esta verificado
    if (user.email_verified) {
      return res.status(200).json({ message: 'El usuario ya esta verificado.' });
    }

    // 5. Actualizar el usuario a verificado
    await userRepository.updateEmailVerify(decodedToken.id);

    // 6. Responder al cliente
    return res.status(200).json({ message: 'Usuario verificado.' });
  } catch (error) {
    // Si el error es por token expirado, reenviar el correo de verificación
    if (error instanceof jwt.TokenExpiredError) {
      const decodedToken = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET, {
        ignoreExpiration: true,
      });
      const emailToken = jwt.sign(
        {
          id: decodedToken.id,
          email: decodedToken.email,
        },
        process.env.EMAIL_TOKEN_SECRET,
        {
          expiresIn: '1h',
        },
      );

      await nodemailerService.sendMail({
        to: decodedToken.email,
        html: `
        <div>
          <h1>Verifica tu correo</h1>
          <a href="http://localhost:4321/verify/${emailToken}">Verificar</a>
        </div>
        `,
      });
    }

    // Para cualquier otro error, responder con un error genérico
    next(error);
  }
});

// Ruta para refrescar el token de acceso
authRouter.get('/refresh', async (req, res) => {
  // 1. Obtener el refresh token
  const refreshToken = req.cookies?.refresh_token;

  // 2. Decodificar el refresh token
  const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // 3. Encontrar la session asociada al refresh token
  const session = await authRepository.findSessionByJwtId({ jwtid: decodedToken.jti });
  if (!session) return res.sendStatus(401);

  // 4. Crear un nuevo token de acceso y refresh token
  const accessToken = jwt.sign(
    { id: decodedToken.id, email: decodedToken.email },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '30m',
    },
  );
  const refreshTokenId = crypto.randomUUID();
  const newRefreshToken = jwt.sign(
    { id: decodedToken.id, email: decodedToken.email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
      jwtid: refreshTokenId,
    },
  );

  // 5. Guardar el nuevo refresh token en las cookies y actualizar la session en la base de datos
  const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  res.cookie('refresh_token', newRefreshToken, {
    expires: expireDate,
    httpOnly: true,
    secure: process.env.ENV_MODE === 'prod',
    sameSite: 'strict',
  });
  await authRepository.updateSessionJwtId({ jwtid: refreshTokenId, id: session.id });

  // 6. Responder al cliente con el nuevo token de acceso
  return res.status(200).json({ accessToken, userId: decodedToken.id, email: decodedToken.email });
});

// Ruta para obtener la información del usuario autenticado
authRouter.get('/user', authenticate, async (req, res) => {
  return res.status(200).json(req.user);
});

// Ruta para cerrar sesión
authRouter.get('/signout', authenticate, async (req, res) => {
  // 1. Obtener el refresh token
  const refreshToken = req.cookies?.refresh_token;

  // 2. Decodificar el refresh token
  const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // 3. Encontrar la session asociada al refresh token
  const session = await authRepository.findSessionByJwtId({ jwtid: decodedToken.jti });
  if (!session) return res.sendStatus(401);

  // 4. Eliminar el token de los cookies
  const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  res.clearCookie('refresh_token', {
    expires: expireDate,
    httpOnly: true,
    secure: process.env.ENV_MODE === 'prod',
    sameSite: 'strict',
  });

  // 5. Eliminar la session de la base de datos
  await authRepository.deleteSession(session.id);

  // 6. Responder al cliente
  return res.sendStatus(204);
});

export default authRouter;
