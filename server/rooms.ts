import type {WebSocket} from 'ws';

import {GameEngine} from '../src/app/cubes/game.engine';
import {GameState, OwnedCubelet} from '../src/app/cubes/online.protocol';

const COLORS = ['red', 'blue'];

// Unambiguous alphabet (no O/0/I/1) for human-friendly invite codes.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;

interface Seat {
  readonly color: string;
  socket: WebSocket | null;
}

export class Room {
  readonly engine = new GameEngine();
  readonly seats: Seat[] = COLORS.map(color => ({color, socket: null}));
  bothJoined = false;

  constructor(readonly code: string) {}

  seatFor(socket: WebSocket): Seat | undefined {
    return this.seats.find(seat => seat.socket === socket);
  }

  firstEmptySeat(): Seat | undefined {
    return this.seats.find(seat => seat.socket === null);
  }

  occupants(): WebSocket[] {
    return this.seats
      .map(seat => seat.socket)
      .filter((s): s is WebSocket => s !== null);
  }

  state(): GameState {
    const board: OwnedCubelet[] = [];

    for (const point of this.engine.cubeletsArray) {
      const cubelet = this.engine.cubeletAt(point.x, point.y, point.z);
      if (cubelet.player !== undefined) {
        board.push({x: point.x, y: point.y, z: point.z, player: cubelet.player});
      }
    }

    return {
      board,
      currentPlayer: this.engine.currentPlayer,
      winner: this.engine.winner,
      tied: this.engine.tied,
    };
  }
}

export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  create(socket: WebSocket): {room: Room; color: string} {
    const room = new Room(this.generateCode());
    this.rooms.set(room.code, room);

    const seat = room.seats[0];
    seat.socket = socket;

    return {room, color: seat.color};
  }

  join(
    code: string,
    socket: WebSocket,
  ): {room: Room; color: string} | {error: string} {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) {
      return {error: 'Game not found. Check the code and try again.'};
    }

    const seat = room.firstEmptySeat();

    if (!seat) {
      return {error: 'This game is already full.'};
    }

    seat.socket = socket;
    room.bothJoined = true;

    return {room, color: seat.color};
  }

  remove(room: Room): void {
    this.rooms.delete(room.code);
  }

  private generateCode(): string {
    for (let attempt = 0; attempt < 1000; attempt++) {
      let code = '';
      for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) {
        return code;
      }
    }

    throw new Error('Unable to allocate a unique room code');
  }
}
