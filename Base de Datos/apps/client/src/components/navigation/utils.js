import authService from '../../features/auth/auth.service';

export const getLinks = (pathname) => {
  let links = [];
  console.log('112121221221');

  console.log(pathname);

  if (pathname === '/login/') {
    links = links.concat({ name: 'Registro', to: '/signup' });
    links = links.concat({ name: 'Inicio', to: '/' });
  }

  if (pathname === '/signup/') {
    links = links.concat({ name: 'Inicio', to: '/' });
    links = links.concat({ name: 'Login', to: '/login' });
  }

  if (pathname === '/') {
    links = links.concat({ name: 'Login', to: '/login' });
    links = links.concat({ name: 'Registro', to: '/signup' });
  }

  return links;
};

export const getButtons = (pathname) => {
  let buttons = [];

  if (pathname === '/contacts/') {
    buttons = buttons.concat({
      name: 'Cerrar sesión',
      handler: () => {
        authService.signOut();
        location.assign('/login');
      },
    });
  }

  return buttons;
};
