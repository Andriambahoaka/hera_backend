const http = require('http');
const app = require('./app');

const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
});

server.listen(port,'0.0.0.0');
// CORS : Cross Origin Ressource Shraring 
// Nécéssaire à partir du moment ou le back end and front end ne partage pas la même origine
// En tetes http, un système de sécurité pour bloquer les requetes malveillants

//CORS signifie « Cross Origin Resource Sharing ».
// Il s'agit d'un système de sécurité qui, par défaut, 
// bloque les appels HTTP entre des serveurs différents,
 // ce qui empêche donc les requêtes malveillantes
 //  d accéder à des ressources sensibles auquels ils n'ont pas le droit d'accès. Dans notre cas,
 ////   nous avons deux origines : localhost:3000 et localhost:4200 , 
   // et nous souhaiterions qu'elles puissent communiquer entre elles. 
   // Pour cela, nous devons ajouter des headers à notre objet  response .