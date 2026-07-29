import {Point3} from './cube.model';
import {GameEngine} from './game.engine';

export type AiDifficulty = 'easy' | 'hard';

/**
 * Client-side computer opponent.
 *
 * A "winning move" cannot be read directly off the risk factor: because
 * selecting a cubelet also fills its symmetric partner, an empty cubelet's risk
 * tops out below 1 (risk 1 only appears once a plane is already complete). So we
 * ask the engine's cheap `completes()` check whether a candidate move finishes a
 * plane (for wins and blocks), then fall back to the risk-factor heuristic for
 * positional play.
 */
export class AiPlayer {
  constructor(readonly difficulty: AiDifficulty = 'hard') {}

  /**
   * Picks a legal move for `player`. Returns undefined only when the board has
   * no empty cubelet left.
   */
  chooseMove(engine: GameEngine, player: string): Point3 | undefined {
    const empties = engine.cubeletsArray.filter(
      point => engine.cubeletAt(point.x, point.y, point.z).player === undefined,
    );

    if (empties.length === 0) {
      return undefined;
    }

    if (this.difficulty === 'easy') {
      return this.randomChoice(empties);
    }

    const opponent = engine.players.find(p => p !== player) ?? player;

    // 1. Take an immediate winning move if one exists.
    const winning = empties.filter(p => engine.completes(player, p.x, p.y, p.z));
    if (winning.length > 0) {
      return this.randomChoice(winning);
    }

    // 2. Otherwise block a move that would let the opponent win next.
    const blocking = empties.filter(p =>
      engine.completes(opponent, p.x, p.y, p.z),
    );
    if (blocking.length > 0) {
      return this.randomChoice(blocking);
    }

    // 3. Otherwise maximise our own plane progress minus the opponent's,
    //    breaking ties randomly.
    let bestScore = -Infinity;
    let best: Point3[] = [];

    for (const point of empties) {
      const score =
        engine.riskFor(point, player) - engine.riskFor(point, opponent);

      if (score > bestScore) {
        bestScore = score;
        best = [point];
      } else if (score === bestScore) {
        best.push(point);
      }
    }

    return this.randomChoice(best);
  }

  private randomChoice(points: Point3[]): Point3 {
    return points[Math.floor(Math.random() * points.length)];
  }
}
