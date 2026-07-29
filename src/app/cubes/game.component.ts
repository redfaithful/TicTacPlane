import {Component, OnInit} from '@angular/core';
import {Cube, Cubelet, Point3} from './cube.model';
import {PolarAngels} from './game.utils';
import {sortedIndexesArray} from './cube.utils';

interface CubeletRiskFactor {
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

@Component({
  selector: 'app-cubes',
  standalone: false,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  cube!: Cube;
  cubeletsArray: Point3[] = [];

  readonly defaultColour = 'lightgray';
  readonly disabledColour = 'white';
  readonly players: string[] = ['red', 'blue'];

  turn = 0;
  cubeSize = 3;
  cubeTransformSize = 0;

  winner?: string;
  tied = false;

  mouse = {
    down: false,
    x: 0,
    y: 0,
  };

  mouseTracking?: PolarAngels;

  ngOnInit(): void {
    this.cube = new Cube(this.cubeSize);
    this.cubeTransformSize = (this.cubeSize - 1) / 2;
    this.cubeletsArray = this.cube.cubeletsArray();
  }

  private hasAvailableMoves(): boolean {
    return this.cubeletsArray.some(point => {
      const cubelet = this.cube.cubeletAt(
        point.x,
        point.y,
        point.z,
      ) as GameCubelet;

      return cubelet.player === undefined;
    });
  }

  playTurn(x: number, y: number, z: number): TurnResult {
    const player = this.players[this.turn % this.players.length];

    if (this.winner !== undefined || this.tied) {
      return {
        accepted: false,
        won: false,
        tied: this.tied,
        player,
        reason: 'game-over',
      };
    }

    const result = this.playerSelectCubelet(
      player,
      x,
      y,
      z,
    );

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
    const cubelet = this.cube.cubeletAt(
      x,
      y,
      z,
    ) as GameCubelet;

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

    const symmetryCubelet = this.cube.cubeletAt(
      Cube.symmetry(x),
      Cube.symmetry(y),
      Cube.symmetry(z),
    ) as GameCubelet;

    symmetryCubelet.player = player;

    const won = this.updateRiskFactor(player);

    if (won) {
      console.log(`${player} completed a plane`);
    }

    return {
      accepted: true,
      won,
      tied: false,
      player,
    };
  }

  private resetRiskFactors(): void {
    for (let x = -this.cubeTransformSize;
         x <= this.cubeTransformSize;
         x++) {
      for (let y = -this.cubeTransformSize;
           y <= this.cubeTransformSize;
           y++) {
        for (let z = -this.cubeTransformSize;
             z <= this.cubeTransformSize;
             z++) {
          const cubelet = this.cube.cubeletAt(
            x,
            y,
            z,
          ) as GameCubelet;

          cubelet.riskFactor = this.createInitialRiskFactor();
        }
      }
    }
  }

  private getAllNonZeroPoints(): Point3[] {
    const points: Point3[] = [];

    for (let x = -this.cubeTransformSize;
         x <= this.cubeTransformSize;
         x++) {
      for (let y = -this.cubeTransformSize;
           y <= this.cubeTransformSize;
           y++) {
        for (let z = -this.cubeTransformSize;
             z <= this.cubeTransformSize;
             z++) {
          if (x === 0 && y === 0 && z === 0) {
            continue;
          }

          points.push(new Point3(x, y, z));
        }
      }
    }

    return points;
  }

  private getUniquePlaneCubelets(
    point1: Point3,
    point2: Point3,
  ): Point3[] {
    const uniquePoints = new Map<string, Point3>();

    for (const point of this.getPlaneCubelets(point1, point2)) {
      uniquePoints.set(point.toString(), point);
    }

    return [...uniquePoints.values()];
  }

  private getPlaneKey(points: Point3[]): string {
    return points
      .map(point => point.toString())
      .sort()
      .join('|');
  }

  private calculatePlaneRisk(
    planePoints: Point3[],
    player: string,
  ): number {
    let playerCubelets = 0;

    for (const point of planePoints) {
      const cubelet = this.cube.cubeletAt(
        point.x,
        point.y,
        point.z,
      ) as GameCubelet;

      if (
        cubelet.player !== undefined &&
        cubelet.player !== player
      ) {
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
      const cubelet = this.cube.cubeletAt(
        point.x,
        point.y,
        point.z,
      ) as GameCubelet;

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

  updateRiskFactor(
    player: string,
  ): boolean {
    this.resetRiskFactors();

    const points = this.getAllNonZeroPoints();
    const visitedPlanes = new Set<string>();
    let playerWon = false;

    for (let first = 0; first < points.length; first++) {
      for (let second = first + 1; second < points.length; second++) {
        const planePoints = this.getUniquePlaneCubelets(
          points[first],
          points[second],
        );

        /*
         * Two linearly dependent points generate only a line, not a plane.
         * A two-dimensional plane over a field of size p contains p² - 1
         * non-zero points.
         */
        const expectedPlaneSize =
          this.cubeSize * this.cubeSize - 1;

        if (planePoints.length !== expectedPlaneSize) {
          continue;
        }

        const planeKey = this.getPlaneKey(planePoints);

        if (visitedPlanes.has(planeKey)) {
          continue;
        }

        visitedPlanes.add(planeKey);

        for (const evaluatedPlayer of this.players) {
          const risk = this.calculatePlaneRisk(
            planePoints,
            evaluatedPlayer,
          );

          this.applyPlaneRisk(
            planePoints,
            evaluatedPlayer,
            risk,
          );

          if (evaluatedPlayer === player && risk === 1) {
            playerWon = true;
          }
        }
      }
    }

    return playerWon;
  }

  private createInitialRiskFactor(): CubeletRiskFactor {
    const riskFactor: CubeletRiskFactor = {};

    for (const player of this.players) {
      riskFactor[player] = -1;
    }

    return riskFactor;
  }

  getPlaneCubelets(point1: Point3, point2: Point3): Point3[] {
    const plane: Point3[] = [];

    for (
      let i = -this.cubeTransformSize;
      i <= this.cubeTransformSize;
      i++
    ) {
      for (
        let j = -this.cubeTransformSize;
        j <= this.cubeTransformSize;
        j++
      ) {
        if (i !== 0 || j !== 0) {
          plane.push(
            this.linearCombination(i, point1, j, point2),
          );
        }
      }
    }

    return plane;
  }

  linearCombination(
    i: number,
    pointI: Point3,
    j: number,
    pointJ: Point3,
  ): Point3 {
    return new Point3(
      this.cycle(i * pointI.x + j * pointJ.x),
      this.cycle(i * pointI.y + j * pointJ.y),
      this.cycle(i * pointI.z + j * pointJ.z),
    );
  }

  cycle(n: number): number {
    return (
      ((n + this.cubeSize + this.cubeTransformSize) %
        this.cubeSize) -
      this.cubeTransformSize
    );
  }

  mousePress(event: MouseEvent): void {
    this.mouse.down = true;
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  mouseMove(event: MouseEvent): void {
    if (!this.mouse.down) {
      return;
    }

    const deltaX = event.clientX - this.mouse.x;
    const deltaY = event.clientY - this.mouse.y;
    const distance = deltaX * deltaX + deltaY * deltaY;

    if (distance <= 16) {
      return;
    }

    const theta = deltaX * Math.PI / -720;
    const phi = deltaY * Math.PI / -360;

    this.mouseTracking = new PolarAngels(theta, phi);
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;

    this.reorderCubelets();
  }

  mouseRelease(): void {
    window.setTimeout(() => {
      this.mouse.down = false;
    }, 100);
  }

  reorderCubelets(): void {
    const wrapper =
      document.querySelector<HTMLElement>('.game-component');

    if (!wrapper) {
      return;
    }

    const items = Array.from(wrapper.children);
    const textContent = wrapper.textContent?.trim();

    if (!textContent) {
      return;
    }

    const zIndexes = sortedIndexesArray(
      textContent
        .split(/\s+/)
        .map(value => Number.parseInt(value, 10)),
    );

    for (const index of zIndexes) {
      const item = items[index];

      if (item) {
        wrapper.appendChild(item);
      }
    }
  }

  getOffsetX(point: Point3): number {
    return point.x;
  }

  getOffsetY(point: Point3): number {
    return point.y;
  }

  getOffsetZ(point: Point3): number {
    return point.z;
  }

  select(point: Point3): void {
    this.playTurn(
      point.x,
      point.y,
      point.z,
    );
  }

  getCubeletColour(point: Point3): string {
    const cubelet = this.cube.cubeletAt(
      point.x,
      point.y,
      point.z,
    ) as GameCubelet;

    if (cubelet.player !== undefined) {
      return cubelet.player;
    }

    if (this.winner !== undefined || this.tied) {
      return this.disabledColour;
    }

    return this.defaultColour;
  }
}
