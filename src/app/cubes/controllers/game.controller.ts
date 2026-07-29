import {Point3} from '../cube.model';
import {GameEngine} from '../game.engine';

/**
 * Drives a game for the presentation layer (GameComponent). Each mode
 * — local hot-seat, vs computer, online — provides its own implementation,
 * so the component stays purely about rendering and input.
 */
export interface GameController {
  readonly engine: GameEngine;

  /** Human-readable status line shown above the board. */
  statusText(): string;

  /** Whether the local human may click a cubelet right now. */
  canSelect(): boolean;

  /** Handle a local human selecting a cubelet. */
  select(point: Point3): void;

  /** Start a fresh game (where the mode supports it). */
  reset(): void;

  /** Whether this mode offers a local "New game" button. */
  readonly canReset: boolean;

  /** Optional shareable invite link (online mode only). */
  inviteLink?: string;

  /** Tear down timers / sockets. */
  destroy(): void;
}

/** Shared helper: describe terminal / turn state from an engine. */
export function baseStatus(engine: GameEngine): string {
  if (engine.winner !== undefined) {
    return `${engine.winner} wins!`;
  }

  if (engine.tied) {
    return 'The game ended in a tie.';
  }

  return `${engine.currentPlayer} to move`;
}
