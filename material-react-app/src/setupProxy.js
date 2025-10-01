const { createProxyMiddleware } = require('http-proxy-middleware');

const apiRoutes = [
  '/auth',
  '/me',
  '/users',
  '/roles',
  '/groups',
  '/platforms',
  '/packages',
  '/imports',
  '/conjur',
];

// Configuração do proxy com a função onProxyReq
const proxyConfig = {
  target: 'http://localhost:8080',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Esta função é chamada para cada requisição que passa pelo proxy.
    // Verificamos se a requisição original do navegador tem o cabeçalho de autorização.
    if (req.headers.authorization) {
      // Se tiver, nós o reescrevemos na requisição que será enviada ao backend.
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
  },
};

module.exports = function (app) {
  // Aplica o proxy para cada rota da API individualmente
  apiRoutes.forEach(route => {
    app.use(route, createProxyMiddleware(proxyConfig));
  });
};