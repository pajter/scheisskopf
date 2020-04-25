import fs from 'fs';
import path from 'path';

import { createServer } from 'https';
import express from 'express';
import socketIo from 'socket.io';

import './console';

import { ScheissApp } from './app';

////////////////////////////

const sslConfig = fs.existsSync(path.join(__dirname, '../.ssl'))
  ? {
      key: fs.readFileSync(path.join(__dirname, '../.ssl/server.key'), 'utf8'),
      cert: fs.readFileSync(path.join(__dirname, '../.ssl/server.crt'), 'utf8'),
    }
  : {};

const boot = () => {
  const expressApp = express();
  const server = createServer(
    {
      ...sslConfig,
    },
    expressApp
  );

  const io = socketIo(server, {
    pingInterval: 10000,
  });

  new ScheissApp(io);

  // Serve index.html
  expressApp.get('/', (_, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

    res.send(html);
  });

  expressApp.use('/static', express.static(path.join(__dirname, 'static')));

  server.listen(3000, 'localhost', function () {
    console.info('Listening on *:3000');
  });

  return server;
};

boot();
