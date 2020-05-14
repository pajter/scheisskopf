import fs from 'fs';
import path from 'path';

import { createServer } from 'http';
import express from 'express';
import socketIo from 'socket.io';

import './console';

import { ScheissApp } from './app';

process.on('SIGINT', () => {
  console.info('Interrupted');
  process.exit(0);
});

////////////////////////////

const boot = () => {
  const expressApp = express();
  const server = createServer({}, expressApp);

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

  server.listen({ port: 3000, https: false }, function () {
    console.info('Listening on *:3000');
  });

  return server;
};

boot();
