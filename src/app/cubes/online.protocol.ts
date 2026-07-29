/**
 * Wire protocol shared by the Angular client and the multiplayer server.
 * Kept free of any Angular/Node dependency so both builds can import it.
 */

export interface OwnedCubelet {
  x: number;
  y: number;
  z: number;
  player: string;
}

export interface GameState {
  board: OwnedCubelet[];
  currentPlayer: string;
  winner?: string;
  tied: boolean;
}

/** Messages sent from a browser to the server. */
export type ClientMessage =
  | {type: 'create'}
  | {type: 'join'; code: string}
  | {type: 'move'; x: number; y: number; z: number}
  | {type: 'reset'};

/** Messages sent from the server to a browser. */
export type ServerMessage =
  | {type: 'created'; code: string; color: string; state: GameState}
  | {type: 'joined'; code: string; color: string; state: GameState}
  | {type: 'start'; state: GameState}
  | {type: 'state'; state: GameState}
  | {type: 'opponent-left'}
  | {type: 'error'; reason: string};
