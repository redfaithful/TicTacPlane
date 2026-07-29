import {Point3} from '../cube.model';
import {GameEngine} from '../game.engine';
import {AiDifficulty, AiPlayer} from '../ai.player';
import {GameController} from './game.controller';

/**
 * Human vs computer. The human plays the first player colour; the AI replies
 * on a short delay so the board update is visible.
 */
export class AiController implements GameController {
  readonly engine = new GameEngine();
  readonly canReset = true;

  private readonly human: string;
  private readonly ai: string;
  private readonly aiPlayer: AiPlayer;
  private thinking = false;
  private pendingTimer?: ReturnType<typeof setTimeout>;

  constructor(difficulty: AiDifficulty = 'hard') {
    this.human = this.engine.players[0];
    this.ai = this.engine.players[1] ?? this.engine.players[0];
    this.aiPlayer = new AiPlayer(difficulty);
  }

  statusText(): string {
    if (this.engine.winner !== undefined) {
      return this.engine.winner === this.human ? 'You win!' : 'Computer wins!';
    }

    if (this.engine.tied) {
      return 'The game ended in a tie.';
    }

    return this.thinking ? 'Computer is thinking…' : 'Your move';
  }

  canSelect(): boolean {
    return (
      !this.engine.isOver &&
      !this.thinking &&
      this.engine.currentPlayer === this.human
    );
  }

  select(point: Point3): void {
    if (!this.canSelect()) {
      return;
    }

    const result = this.engine.playTurn(point.x, point.y, point.z);

    if (!result.accepted || this.engine.isOver) {
      return;
    }

    this.scheduleAiMove();
  }

  reset(): void {
    this.clearTimer();
    this.thinking = false;
    this.engine.reset();
  }

  destroy(): void {
    this.clearTimer();
  }

  private scheduleAiMove(): void {
    // Stay "thinking" (board disabled) for the whole AI turn — through the
    // short delay AND the move computation — so no stray click lands until it
    // is genuinely the human's turn again.
    this.thinking = true;

    this.pendingTimer = setTimeout(() => {
      if (!this.engine.isOver && this.engine.currentPlayer === this.ai) {
        const move = this.aiPlayer.chooseMove(this.engine, this.ai);

        if (move) {
          this.engine.playTurn(move.x, move.y, move.z);
        }
      }

      this.thinking = false;
    }, 250);
  }

  private clearTimer(): void {
    if (this.pendingTimer !== undefined) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = undefined;
    }
  }
}
