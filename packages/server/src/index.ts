import fs from 'fs';
import path from 'path';
import util from 'util';
import { createServer } from 'https';
import express from 'express';
import socketIo from 'socket.io';

import { ScheissApp } from './app';

declare global {
  interface Console {
    logObject: (obj: object) => void;
  }
}

Object.defineProperty(console, 'logObject', {
  value: (obj: object) =>
    console.log(util.inspect(obj, false, 10, true /* enable colors */)),
});

////////////////////////////

const boot = () => {
  const expressApp = express();
  const server = createServer(
    {
      key: fs.readFileSync(path.join(__dirname, '../.ssl/server.key'), 'utf8'),
      cert: fs.readFileSync(path.join(__dirname, '../.ssl/server.crt'), 'utf8'),
    },
    expressApp
  );

  const io = socketIo(server, {
    pingInterval: 10000,
  });

  const scheissApp = new ScheissApp(io);

  // Auth middleware
  expressApp.use((req, res, next) => {
    const auth = { login: 'admin', password: 'admin' };

    // Parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64')
      .toString()
      .split(':');

    // Verify login and password are set and correct
    if (login === auth.login && password === auth.password) {
      // Access granted...
      return next();
    }

    // Access denied...
    res.set('WWW-Authenticate', 'Basic realm="Scheisskopf"');
    res.status(401).send('Authentication required.');
  });

  // Serve index.html
  expressApp.get('/', (_, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

    res.send(html);
  });

  expressApp.use('/static', express.static(path.join(__dirname, 'static')));

  expressApp.get('/api/rooms', (_, res) => {
    res.json(scheissApp.storeRooms.map((storeRoom) => storeRoom.getState()));
  });

  expressApp.get('/api/users', (_, res) => {
    res.json(scheissApp.users);
  });

  server.listen(3000, function () {
    console.info('Listening on *:3000');
  });

  return server;
};

boot();
