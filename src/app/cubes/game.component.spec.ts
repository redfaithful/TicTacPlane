import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ActivatedRoute, convertToParamMap} from '@angular/router';

import {GameComponent} from './game.component';
import {VisualCubeComponent} from './visual/visual.cube.component';

function routeStub(mode: string, queryParams: Record<string, string> = {}) {
  return {
    snapshot: {
      data: {mode},
      queryParamMap: convertToParamMap(queryParams),
    },
  } as unknown as ActivatedRoute;
}

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [GameComponent, VisualCubeComponent],
      providers: [{provide: ActivatedRoute, useValue: routeStub('local')}],
    })
      .overrideComponent(GameComponent, {set: {template: ''}})
      .compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should be created with a local controller and size-3 cube', () => {
    expect(component.controller).toBeTruthy();
    expect(component.cubeSize).toBe(3);
    expect(component.engine.cube.length).toBe(3);
  });

  it('should play a turn through the controller when selecting', () => {
    expect(component.canSelect()).toBeTrue();

    component.select({x: 1, y: 1, z: 1} as never);

    expect(component.engine.turn).toBe(1);
    expect(component.engine.cubeletAt(1, 1, 1).player).toBe('red');
  });

  it('should reset the game on newGame()', () => {
    component.select({x: 1, y: 1, z: 1} as never);
    expect(component.engine.turn).toBe(1);

    component.newGame();
    expect(component.engine.turn).toBe(0);
    expect(component.engine.cubeletAt(1, 1, 1).player).toBeUndefined();
  });
});
