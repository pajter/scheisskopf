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

  io.on('connection', (socket) => {
    new ScheissApp(socket);
  });

  expressApp.get('/', function (_, res) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.send(html);
  });

  server.listen(3000, function () {
    console.info('Listening on *:3000');
  });

  return server;
};

boot();
