import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {GameComponent, GameCubelet} from './game.component';
import {VisualCubeComponent} from './visual/visual.cube.component';
import {Cube} from './cube.model';

describe('GameComponent', () => {
    let component: GameComponent;
    let fixture: ComponentFixture<GameComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [GameComponent, VisualCubeComponent],
      })
        .overrideComponent(GameComponent, {
          set: {
            template: '',
          },
        })
        .compileComponents();

      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should be created', () => {
      expect(component.cube.length).toEqual(3);
    });

    it('should correctly set cubelet attribute', () => {
      const cubelet000 = component.cube.cubeletAt(0, 0, 0);
      expect(cubelet000['color']).toBeUndefined();
      cubelet000['color'] = 'red';
      const cubelet000again = component.cube.cubeletAt(0, 0, 0);
      expect(cubelet000again['color']).toEqual('red');
    });

    it('should correctly change turns and report the player', () => {
      const firstTurn = component.playTurn(1, 1, 1);

      expect(firstTurn).toEqual({
        accepted: true,
        won: false,
        tied: false,
        player: 'red',
      });
      expect(component.turn).toBe(1);
      expect(component.tied).toBeFalse();
      expect(component.winner).toBeUndefined();

      const invalidTurn = component.playTurn(1, 1, 1);

      expect(invalidTurn).toEqual({
        accepted: false,
        won: false,
        tied: false,
        player: 'blue',
        reason: 'occupied',
      });
      expect(component.turn).toBe(1);
      expect(component.tied).toBeFalse();

      const secondTurn = component.playTurn(-1, 0, -1);

      expect(secondTurn).toEqual({
        accepted: true,
        won: false,
        tied: false,
        player: 'blue',
      });
      expect(component.turn).toBe(2);
      expect(component.tied).toBeFalse();
      expect(component.winner).toBeUndefined();
    });

    it('should reject all moves after a player wins', () => {
      component.winner = 'red';

      const turnBefore = component.turn;
      const result = component.playTurn(1, 1, 1);

      expect(result.accepted).toBeFalse();
      expect(result.won).toBeFalse();
      expect(result.player).toBe('red');
      expect(component.turn).toBe(turnBefore);
    });

    it('should report a tie when no cubelets remain and there is no winner', () => {
      for (const point of component.cubeletsArray) {
        const cubelet = component.cube.cubeletAt(
          point.x,
          point.y,
          point.z,
        ) as GameCubelet;

        cubelet.player = 'red';
      }

      const finalPoint = component.cubeletsArray[0];
      const finalCubelet = component.cube.cubeletAt(
        finalPoint.x,
        finalPoint.y,
        finalPoint.z,
      ) as GameCubelet;

      const symmetricCubelet = component.cube.cubeletAt(
        Cube.symmetry(finalPoint.x),
        Cube.symmetry(finalPoint.y),
        Cube.symmetry(finalPoint.z),
      ) as GameCubelet;

      finalCubelet.player = undefined;
      symmetricCubelet.player = undefined;

      spyOn(component, 'updateRiskFactor').and.returnValue(false);

      const result = component.playTurn(
        finalPoint.x,
        finalPoint.y,
        finalPoint.z,
      );

      expect(result.accepted).toBeTrue();
      expect(result.won).toBeFalse();
      expect(result.tied).toBeTrue();
      expect(component.tied).toBeTrue();
      expect(component.winner).toBeUndefined();
    });
  }
);

