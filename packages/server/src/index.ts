import express from 'express';
import { createServer } from 'http';

const expressApp = express();
const httpServer = createServer(expressApp);

expressApp.get('/', function(_, res) {
  res.send('<h1>Hello world</h1>');
});

httpServer.listen(3000, function() {
  console.info('Listening on *:3000');
});
