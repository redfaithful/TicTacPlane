import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {GameComponent} from './game.component';
import {VisualCubeComponent} from './visual/visual.cube.component';

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

    it('should correctly change turn and return the right player number', () => {
      expect(component.playTurn(1, 1, 1)).toBeTrue();
      expect(component.playTurn(1, 1, 1)).toBeFalse();
      expect(component.turn).toBe(1);
      expect(component.playTurn(-1, 0, -1)).toBeTrue();
      expect(component.turn).toBe(2);
    });
  }
);
