import {Component, OnInit} from '@angular/core';
import {Cube, Cubelet, Point3} from './cube.model';
import {PolarAngels} from './game.utils';
import {sortedIndexesArray} from './cube.utils';

interface CubeletRiskFactor {
  [player: string]: number;
}

interface GameCubelet extends Cubelet {
  player?: string;
  riskFactor?: CubeletRiskFactor;
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
  readonly players: string[] = ['red', 'blue'];

  turn = 0;
  cubeSize = 3;
  cubeTransformSize = 0;

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

  playTurn(x: number, y: number, z: number): boolean {
    const player = this.players[this.turn % this.players.length];

    if (!this.playerSelectCubelet(player, x, y, z)) {
      return false;
    }

    this.turn += 1;
    return true;
  }

  playerSelectCubelet(
    player: string,
    x: number,
    y: number,
    z: number,
  ): boolean {
    const cubelet = this.cube.cubeletAt(x, y, z) as GameCubelet;

    if (cubelet.player !== undefined) {
      return false;
    }

    cubelet.player = player;

    const symmetryCubelet = this.cube.cubeletAt(
      Cube.symmetry(x),
      Cube.symmetry(y),
      Cube.symmetry(z),
    ) as GameCubelet;

    symmetryCubelet.player = player;

    this.updateRiskFactor(
      cubelet,
      symmetryCubelet,
      player,
      x,
      y,
      z,
    );

    return true;
  }

  updateRiskFactor(
    cubelet: GameCubelet,
    symmetryCubelet: GameCubelet,
    player: string,
    x: number,
    y: number,
    z: number,
  ): boolean {
    cubelet.riskFactor = this.createInitialRiskFactor();
    symmetryCubelet.riskFactor = this.createInitialRiskFactor();

    const pointXYZ = new Point3(x, y, z);
    const visited = new Set<string>([pointXYZ.toString()]);

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
        for (
          let k = -this.cubeTransformSize;
          k <= this.cubeTransformSize;
          k++
        ) {
          if (i === 0 && j === 0 && k === 0) {
            continue;
          }

          const pointIJK = new Point3(i, j, k);

          if (visited.has(pointIJK.toString())) {
            continue;
          }

          const cubeletIJK = this.cube.cubeletAt(
            i,
            j,
            k,
          ) as GameCubelet;

          // Ignore already selected cubelets.
          if (cubeletIJK.player !== undefined) {
            continue;
          }

          // Find the plane common to pointIJK and pointXYZ.
          const planeCubelets = this.getPlaneCubelets(
            pointIJK,
            pointXYZ,
          );

          for (const point of planeCubelets) {
            visited.add(point.toString());
          }

          /*
           * Calculate the risk factor of the plane here and apply it
           * to the relevant cubelets.
           *
           * The original file did not yet contain this calculation.
           */
        }
      }
    }

    // Avoid an unused-parameter warning until the risk calculation uses it.
    void player;

    return false;
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

  getCubeSize(): number {
    return this.cubeSize;
  }

  printAttribute(attr: string): void {
    this.cube.printAttribute(attr);
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
    this.playTurn(point.x, point.y, point.z);
  }

  getCubeletColour(point: Point3): string {
    const cubelet = this.cube.cubeletAt(
      point.x,
      point.y,
      point.z,
    ) as GameCubelet;

    return cubelet.player ?? this.defaultColour;
  }
}
