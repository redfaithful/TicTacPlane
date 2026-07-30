import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {Point3} from './cube.model';
import {GameEngine} from './game.engine';
import {PolarAngels} from './game.utils';
import {sortedIndexesArray} from './cube.utils';
import {OnlineService} from './online.service';
import {GameController} from './controllers/game.controller';
import {LocalController} from './controllers/local.controller';
import {AiController} from './controllers/ai.controller';
import {OnlineController} from './controllers/online.controller';

export {GameCubelet, TurnResult} from './game.engine';

export type GameMode = 'local' | 'ai' | 'online';

@Component({
  selector: 'app-cubes',
  standalone: false,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, OnDestroy {
  controller!: GameController;
  cubeTransformSize = 0;

  readonly defaultColour = 'lightgray';
  readonly disabledColour = 'white';

  mouse = {
    down: false,
    dragged: false,
    x: 0,
    y: 0,
  };

  mouseTracking?: PolarAngels;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly online: OnlineService,
  ) {}

  ngOnInit(): void {
    const mode = (this.route.snapshot.data['mode'] as GameMode) ?? 'local';
    this.controller = this.createController(mode);
    this.cubeTransformSize = (this.engine.cubeSize - 1) / 2;
  }

  ngOnDestroy(): void {
    this.controller?.destroy();
  }

  private createController(mode: GameMode): GameController {
    switch (mode) {
      case 'ai':
        return new AiController();
      case 'online': {
        const join =
          this.route.snapshot.queryParamMap.get('join') ?? undefined;
        return new OnlineController(this.online, window.location.origin, join);
      }
      default:
        return new LocalController();
    }
  }

  get engine(): GameEngine {
    return this.controller.engine;
  }

  get cubeletsArray(): Point3[] {
    return this.engine.cubeletsArray;
  }

  get cubeSize(): number {
    return this.engine.cubeSize;
  }

  get statusText(): string {
    return this.controller.statusText();
  }

  get inviteLink(): string | undefined {
    return this.controller.inviteLink;
  }

  canSelect(): boolean {
    return this.controller.canSelect();
  }

  newGame(): void {
    this.controller.reset();
  }

  select(point: Point3): void {
    if (this.mouse.dragged) {
      this.mouse.dragged = false;
      return;
    }

    this.controller.select(point);
  }

  pointerPress(event: PointerEvent): void {
    (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
    this.mouse.down = true;
    this.mouse.dragged = false;
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  pointerMove(event: PointerEvent): void {
    if (!this.mouse.down) {
      return;
    }

    const deltaX = event.clientX - this.mouse.x;
    const deltaY = event.clientY - this.mouse.y;
    const distance = deltaX * deltaX + deltaY * deltaY;

    if (distance <= 16) {
      return;
    }

    const theta = (deltaX * Math.PI) / -720;
    const phi = (deltaY * Math.PI) / -360;

    this.mouseTracking = new PolarAngels(theta, phi);
    this.mouse.dragged = true;
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;

    this.reorderCubelets();
  }

  pointerRelease(): void {
    this.mouse.down = false;
  }

  reorderCubelets(): void {
    const wrapper = document.querySelector<HTMLElement>('.game-component');

    if (!wrapper) {
      return;
    }

    const items = Array.from(wrapper.children);
    const textContent = wrapper.textContent?.trim();

    if (!textContent) {
      return;
    }

    const zIndexes = sortedIndexesArray(
      textContent.split(/\s+/).map(value => Number.parseInt(value, 10)),
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

  getCubeletColour(point: Point3): string {
    const cubelet = this.engine.cubeletAt(point.x, point.y, point.z);

    if (cubelet.player !== undefined) {
      return cubelet.player;
    }

    if (this.engine.isOver) {
      return this.disabledColour;
    }

    return this.defaultColour;
  }
}
