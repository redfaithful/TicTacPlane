import {Cube, Cubelet, Point3} from './cube.model';

export interface CubeletRiskFactor {
  [player: string]: number;
}

export interface GameCubelet extends Cubelet {
  player?: string;
  riskFactor?: CubeletRiskFactor;
}

export interface TurnResult {
  accepted: boolean;
  won: boolean;
  tied: boolean;
  player: string;
  reason?: 'occupied' | 'game-over';
}

/**
 * Framework-agnostic TicTacPlane rules engine.
 *
 * Holds the authoritative game state (the cube, whose turn it is, the winner)
 * and the per-player risk-factor heuristic. It has no Angular dependency so it
 * can be reused by the UI, the AI opponent and the multiplayer server.
 */
export class GameEngine {
  readonly players: string[];
  readonly cubeSize: number;
  readonly cubeTransformSize: number;

  cube!: Cube;
  cubeletsArray: Point3[] = [];

  turn = 0;
  winner?: string;
  tied = false;

  constructor(cubeSize = 3, players: string[] = ['red', 'blue']) {
    this.cubeSize = cubeSize;
    this.players = players;
    this.cubeTransformSize = (cubeSize - 1) / 2;
    this.reset();
  }

  reset(): void {
    this.cube = new Cube(this.cubeSize);
    this.cubeletsArray = this.cube.cubeletsArray();
    this.turn = 0;
    this.winner = undefined;
    this.tied = false;
  }

  get currentPlayer(): string {
    return this.players[this.turn % this.players.length];
  }

  get isOver(): boolean {
    return this.winner !== undefined || this.tied;
  }

  cubeletAt(x: number, y: number, z: number): GameCubelet {
    return this.cube.cubeletAt(x, y, z) as GameCubelet;
  }

  /**
   * Would `player` claiming (x, y, z) complete a plane (i.e. win)? Cheap check
   * used by the AI: it temporarily marks the cubelet and its symmetric partner,
   * scans the cached planes, then restores state. No allocation, no risk
   * recompute.
   */
  completes(player: string, x: number, y: number, z: number): boolean {
    const cubelet = this.cubeletAt(x, y, z);

    if (cubelet.player !== undefined) {
      return false;
    }

    const partner = this.cubeletAt(
      Cube.symmetry(x),
      Cube.symmetry(y),
      Cube.symmetry(z),
    );
    const prevCubelet = cubelet.player;
    const prevPartner = partner.player;

    cubelet.player = player;
    partner.player = player;

    let won = false;
    for (const plane of this.planes()) {
      if (this.calculatePlaneRisk(plane, player) === 1) {
        won = true;
        break;
      }
    }

    cubelet.player = prevCubelet;
    partner.player = prevPartner;

    return won;
  }

  private crossProduct(first: Point3, second: Point3): Point3 {
    return new Point3(
      first.y * second.z - first.z * second.y,
      first.z * second.x - first.x * second.z,
      first.x * second.y - first.y * second.x,
    );
  }

  private isZeroVector(vector: Point3): boolean {
    return (
      vector.x === 0 &&
      vector.y === 0 &&
      vector.z === 0
    );
  }

  private isPointOnCentralPlane(
    point: Point3,
    normal: Point3,
  ): boolean {
    const dotProduct =
      normal.x * point.x +
      normal.y * point.y +
      normal.z * point.z;

    return dotProduct === 0;
  }

  private buildPlanes(): Point3[][] {
    const points = this.cubeletsArray;
    const planesByNormal = new Map<string, Point3[]>();

    /*
     * A valid plane is a complete cubeSize × cubeSize slice through
     * the cube center. The center itself is not selectable, so it
     * contains cubeSize² - 1 playable cubelets.
     */
    const expectedPlaneSize =
      this.cubeSize * this.cubeSize - 1;

    for (let first = 0; first < points.length; first++) {
      for (let second = first + 1; second < points.length; second++) {
        const normal = this.crossProduct(
          points[first],
          points[second],
        );

        // Parallel or opposite vectors do not define a plane.
        if (this.isZeroVector(normal)) {
          continue;
        }

        const normalizedNormal = this.normalizeNormal(normal);
        const planeKey = normalizedNormal.toString();

        if (planesByNormal.has(planeKey)) {
          continue;
        }

        const planePoints = points.filter(point =>
          this.isPointOnCentralPlane(
            point,
            normalizedNormal,
          ),
        );

        /*
         * Reject smaller diagonal subsets. A legal scoring plane must
         * contain the complete central slice.
         */
        if (planePoints.length !== expectedPlaneSize) {
          continue;
        }

        planesByNormal.set(planeKey, planePoints);
      }
    }

    return [...planesByNormal.values()];
  }

  get scoringPlanes(): readonly Point3[][] {
    return this.planes();
  }

  private normalizeNormal(normal: Point3): Point3 {
    const divisor = this.greatestCommonDivisor(
      Math.abs(normal.x),
      Math.abs(normal.y),
      Math.abs(normal.z),
    );

    let x = normal.x / divisor;
    let y = normal.y / divisor;
    let z = normal.z / divisor;

    /*
     * A normal and its negative describe the same plane.
     * Force a canonical sign so both produce the same cache key.
     */
    const firstNonZero = x !== 0 ? x : y !== 0 ? y : z;

    if (firstNonZero < 0) {
      x = -x;
      y = -y;
      z = -z;
    }

    return new Point3(x, y, z);
  }

  private greatestCommonDivisor(...values: number[]): number {
    const gcdOfTwo = (first: number, second: number): number => {
      let a = Math.abs(first);
      let b = Math.abs(second);

      while (b !== 0) {
        const remainder = a % b;
        a = b;
        b = remainder;
      }

      return a;
    };

    const result = values.reduce(
      (current, value) => gcdOfTwo(current, value),
      0,
    );

    // The zero vector is filtered before this method is called.
    return result || 1;
  }

  riskFor(point: Point3, player: string): number {
    const cubelet = this.cubeletAt(point.x, point.y, point.z);
    return cubelet.riskFactor?.[player] ?? -1;
  }

  private hasAvailableMoves(): boolean {
    return this.cubeletsArray.some(point => {
      const cubelet = this.cubeletAt(point.x, point.y, point.z);
      return cubelet.player === undefined;
    });
  }

  playTurn(x: number, y: number, z: number): TurnResult {
    const player = this.currentPlayer;

    if (this.isOver) {
      return {
        accepted: false,
        won: false,
        tied: this.tied,
        player,
        reason: 'game-over',
      };
    }

    const result = this.playerSelectCubelet(player, x, y, z);

    if (!result.accepted) {
      return result;
    }

    this.turn += 1;

    if (result.won) {
      this.winner = result.player;
      return result;
    }

    if (!this.hasAvailableMoves()) {
      this.tied = true;

      return {
        ...result,
        tied: true,
      };
    }

    return result;
  }

  playerSelectCubelet(
    player: string,
    x: number,
    y: number,
    z: number,
  ): TurnResult {
    const cubelet = this.cubeletAt(x, y, z);

    if (cubelet.player !== undefined) {
      return {
        accepted: false,
        won: false,
        tied: false,
        player,
        reason: 'occupied',
      };
    }

    cubelet.player = player;

    const symmetryCubelet = this.cubeletAt(
      Cube.symmetry(x),
      Cube.symmetry(y),
      Cube.symmetry(z),
    );

    symmetryCubelet.player = player;

    const won = this.updateRiskFactor(player);

    return {
      accepted: true,
      won,
      tied: false,
      player,
    };
  }

  private resetRiskFactors(): void {
    for (let x = -this.cubeTransformSize; x <= this.cubeTransformSize; x++) {
      for (let y = -this.cubeTransformSize; y <= this.cubeTransformSize; y++) {
        for (let z = -this.cubeTransformSize; z <= this.cubeTransformSize; z++) {
          const cubelet = this.cubeletAt(x, y, z);
          cubelet.riskFactor = this.createInitialRiskFactor();
        }
      }
    }
  }

  private calculatePlaneRisk(planePoints: Point3[], player: string): number {
    let playerCubelets = 0;

    for (const point of planePoints) {
      const cubelet = this.cubeletAt(point.x, point.y, point.z);

      if (cubelet.player !== undefined && cubelet.player !== player) {
        return -1;
      }

      if (cubelet.player === player) {
        playerCubelets++;
      }
    }

    return playerCubelets / planePoints.length;
  }

  private applyPlaneRisk(
    planePoints: Point3[],
    player: string,
    risk: number,
  ): void {
    for (const point of planePoints) {
      const cubelet = this.cubeletAt(point.x, point.y, point.z);

      // Risk is useful primarily for currently selectable cubelets.
      if (cubelet.player !== undefined) {
        continue;
      }

      cubelet.riskFactor ??= this.createInitialRiskFactor();

      cubelet.riskFactor[player] = Math.max(
        cubelet.riskFactor[player] ?? -1,
        risk,
      );
    }
  }

  updateRiskFactor(player: string): boolean {
    this.resetRiskFactors();

    let playerWon = false;

    for (const planePoints of this.planes()) {
      for (const evaluatedPlayer of this.players) {
        const risk = this.calculatePlaneRisk(planePoints, evaluatedPlayer);

        this.applyPlaneRisk(planePoints, evaluatedPlayer, risk);

        if (evaluatedPlayer === player && risk === 1) {
          playerWon = true;
        }
      }
    }

    return playerWon;
  }

  // The set of scoring planes depends only on the cube size, so build it once
  // and share it across every engine of that size (including AI simulations).
  private static readonly planeCache = new Map<number, Point3[][]>();

  private planes(): Point3[][] {
    let cached = GameEngine.planeCache.get(this.cubeSize);

    if (!cached) {
      cached = this.buildPlanes();
      GameEngine.planeCache.set(this.cubeSize, cached);
    }

    return cached;
  }

  private createInitialRiskFactor(): CubeletRiskFactor {
    const riskFactor: CubeletRiskFactor = {};

    for (const player of this.players) {
      riskFactor[player] = -1;
    }

    return riskFactor;
  }
}
