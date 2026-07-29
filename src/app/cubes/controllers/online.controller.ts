import {Subscription} from 'rxjs';

import {Point3} from '../cube.model';
import {GameEngine} from '../game.engine';
import {OnlineService} from '../online.service';
import {GameState, ServerMessage} from '../online.protocol';
import {GameController} from './game.controller';

/**
 * Online multiplayer. The server is authoritative: we send moves and only
 * update the board when the server broadcasts new state back. The local engine
 * is used purely as a render mirror.
 */
export class OnlineController implements GameController {
  readonly engine = new GameEngine();
  readonly canReset = true;
  inviteLink?: string;

  private myColor?: string;
  private serverCurrentPlayer?: string;
  private started = false;
  private opponentLeft = false;
  private errorReason?: string;
  private connectionLost = false;
  private readonly subs = new Subscription();

  constructor(
    private readonly online: OnlineService,
    private readonly origin: string,
    private readonly joinCode?: string,
  ) {
    this.subs.add(this.online.messages$.subscribe(m => this.handle(m)));
    this.subs.add(
      this.online.connection$.subscribe(state => {
        if (state === 'closed' || state === 'error') {
          this.connectionLost = true;
        }
      }),
    );

    this.online.connect();

    if (this.joinCode) {
      this.online.send({type: 'join', code: this.joinCode});
    } else {
      this.online.send({type: 'create'});
    }
  }

  statusText(): string {
    if (this.errorReason) {
      return this.errorReason;
    }

    if (this.connectionLost) {
      return 'Connection lost.';
    }

    if (this.opponentLeft) {
      return 'Your opponent left the game.';
    }

    if (this.engine.winner !== undefined) {
      const youWon = this.engine.winner === this.myColor;
      return youWon ? 'You win!' : 'You lose.';
    }

    if (this.engine.tied) {
      return 'The game ended in a tie.';
    }

    if (!this.started) {
      return this.joinCode
        ? 'Joining game…'
        : 'Waiting for an opponent to join…';
    }

    return this.serverCurrentPlayer === this.myColor
      ? 'Your move'
      : "Opponent's move";
  }

  canSelect(): boolean {
    return (
      this.started &&
      !this.opponentLeft &&
      !this.connectionLost &&
      !this.engine.isOver &&
      this.serverCurrentPlayer === this.myColor
    );
  }

  select(point: Point3): void {
    if (!this.canSelect()) {
      return;
    }

    // Optimistically send; the authoritative state comes back from the server.
    this.online.send({type: 'move', x: point.x, y: point.y, z: point.z});
  }

  reset(): void {
    this.online.send({type: 'reset'});
  }

  destroy(): void {
    this.subs.unsubscribe();
    this.online.disconnect();
  }

  private handle(message: ServerMessage): void {
    switch (message.type) {
      case 'created':
        this.myColor = message.color;
        this.inviteLink = `${this.origin}/online?join=${message.code}`;
        this.applyState(message.state);
        break;
      case 'joined':
        this.myColor = message.color;
        this.applyState(message.state);
        break;
      case 'start':
        this.started = true;
        this.opponentLeft = false;
        this.applyState(message.state);
        break;
      case 'state':
        this.applyState(message.state);
        break;
      case 'opponent-left':
        this.opponentLeft = true;
        break;
      case 'error':
        this.errorReason = message.reason;
        break;
    }
  }

  private applyState(state: GameState): void {
    this.engine.reset();

    for (const owned of state.board) {
      this.engine.cubeletAt(owned.x, owned.y, owned.z).player = owned.player;
    }

    this.engine.winner = state.winner;
    this.engine.tied = state.tied;
    this.serverCurrentPlayer = state.currentPlayer;
  }
}
