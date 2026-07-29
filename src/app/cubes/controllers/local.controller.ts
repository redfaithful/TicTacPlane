import {Point3} from '../cube.model';
import {GameEngine} from '../game.engine';
import {baseStatus, GameController} from './game.controller';

/** Hot-seat two-player game: both players share one browser. */
export class LocalController implements GameController {
  readonly engine = new GameEngine();
  readonly canReset = true;

  statusText(): string {
    return baseStatus(this.engine);
  }

  canSelect(): boolean {
    return !this.engine.isOver;
  }

  select(point: Point3): void {
    this.engine.playTurn(point.x, point.y, point.z);
  }

  reset(): void {
    this.engine.reset();
  }

  destroy(): void {
    // No resources to release.
  }
}
