export const CLIENT_ENDPOINT =
  process.env.NODE_ENV === 'production' ? process.env.API_ENDPOINT : 'http://localhost:4321';
