import * as http from 'http';
import * as path from 'path';

import express from 'express';
import {WebSocket, WebSocketServer} from 'ws';

import {ClientMessage, ServerMessage} from '../src/app/cubes/online.protocol';
import {Room, RoomManager} from './rooms';

const PORT = Number(process.env.PORT ?? 8080);

// Angular build output (browser bundle) served as static files.
const STATIC_DIR = path.resolve(__dirname, '../dist/tic-tac-plane/browser');

const app = express();
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.use(express.static(STATIC_DIR));

// SPA fallback: any non-asset GET returns index.html so client routing works.
// Registered as a terminal middleware to stay compatible with Express 4 and 5
// (Express 5 changed how '*' path patterns are parsed).
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    next();
    return;
  }
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({server, path: '/ws'});
const rooms = new RoomManager();

// Track which room each socket belongs to for cleanup on disconnect.
const membership = new Map<WebSocket, Room>();

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcast(room: Room, message: ServerMessage): void {
  for (const socket of room.occupants()) {
    send(socket, message);
  }
}

wss.on('connection', (socket: WebSocket) => {
  socket.on('message', raw => {
    let message: ClientMessage;

    try {
      message = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      send(socket, {type: 'error', reason: 'Malformed message.'});
      return;
    }

    handleMessage(socket, message);
  });

  socket.on('close', () => handleDisconnect(socket));
});

function handleMessage(socket: WebSocket, message: ClientMessage): void {
  switch (message.type) {
    case 'create': {
      const {room, color} = rooms.create(socket);
      membership.set(socket, room);
      send(socket, {type: 'created', code: room.code, color, state: room.state()});
      break;
    }

    case 'join': {
      const result = rooms.join(message.code, socket);

      if ('error' in result) {
        send(socket, {type: 'error', reason: result.error});
        return;
      }

      const {room, color} = result;
      membership.set(socket, room);
      send(socket, {type: 'joined', code: room.code, color, state: room.state()});
      // Both seats filled: start the game for everyone.
      broadcast(room, {type: 'start', state: room.state()});
      break;
    }

    case 'move': {
      const room = membership.get(socket);
      if (!room) {
        return;
      }

      const seat = room.seatFor(socket);
      if (!seat || !room.bothJoined) {
        return;
      }

      // Authoritative: reject moves out of turn or on the finished board.
      if (room.engine.isOver || room.engine.currentPlayer !== seat.color) {
        return;
      }

      const result = room.engine.playTurn(message.x, message.y, message.z);
      if (result.accepted) {
        broadcast(room, {type: 'state', state: room.state()});
      }
      break;
    }

    case 'reset': {
      const room = membership.get(socket);
      if (!room) {
        return;
      }

      room.engine.reset();
      broadcast(room, {type: 'state', state: room.state()});
      break;
    }
  }
}

function handleDisconnect(socket: WebSocket): void {
  const room = membership.get(socket);
  membership.delete(socket);

  if (!room) {
    return;
  }

  const seat = room.seatFor(socket);
  if (seat) {
    seat.socket = null;
  }

  const remaining = room.occupants();

  if (remaining.length === 0) {
    rooms.remove(room);
    return;
  }

  for (const other of remaining) {
    send(other, {type: 'opponent-left'});
  }
}

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`TicTacPlane server listening on :${PORT}`);
});
