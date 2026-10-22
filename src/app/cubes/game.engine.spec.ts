import {vi} from 'vitest';

import {GameEngine} from './game.engine';
import {Cube, Point3} from './cube.model';

function centralPlane(
  engine: GameEngine,
  predicate: (point: Point3) => boolean,
): Point3[] {
  return engine.cubeletsArray.filter(predicate);
}

describe('GameEngine', () => {
  let engine: GameEngine;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    engine = new GameEngine();
  });

  it('should be created with a size-3 cube', () => {
    expect(engine.cube.length).toEqual(3);
  });

  it('should correctly change turns and report the player', () => {
    const firstTurn = engine.playTurn(1, 1, 1);

    expect(firstTurn).toEqual({
      accepted: true,
      won: false,
      tied: false,
      player: 'red',
    });
    expect(engine.turn).toBe(1);
    expect(engine.tied).toBe(false);
    expect(engine.winner).toBeUndefined();

    const invalidTurn = engine.playTurn(1, 1, 1);

    expect(invalidTurn).toEqual({
      accepted: false,
      won: false,
      tied: false,
      player: 'blue',
      reason: 'occupied',
    });
    expect(engine.turn).toBe(1);

    const secondTurn = engine.playTurn(-1, 0, -1);

    expect(secondTurn).toEqual({
      accepted: true,
      won: false,
      tied: false,
      player: 'blue',
    });
    expect(engine.turn).toBe(2);
    expect(engine.winner).toBeUndefined();
  });

  it('should reject all moves after a player wins', () => {
    engine.winner = 'red';

    const turnBefore = engine.turn;
    const result = engine.playTurn(1, 1, 1);

    expect(result.accepted).toBe(false);
    expect(result.won).toBe(false);
    expect(result.player).toBe('red');
    expect(engine.turn).toBe(turnBefore);
  });

  it('should report a tie when no cubelets remain and there is no winner', () => {
    for (const point of engine.cubeletsArray) {
      engine.cubeletAt(point.x, point.y, point.z).player = 'red';
    }

    const finalPoint = engine.cubeletsArray[0];
    engine.cubeletAt(finalPoint.x, finalPoint.y, finalPoint.z).player = undefined;
    engine.cubeletAt(
      Cube.symmetry(finalPoint.x),
      Cube.symmetry(finalPoint.y),
      Cube.symmetry(finalPoint.z),
    ).player = undefined;

    vi.spyOn(engine, 'updateRiskFactor').mockReturnValue(false);

    const result = engine.playTurn(finalPoint.x, finalPoint.y, finalPoint.z);

    expect(result.accepted).toBe(true);
    expect(result.won).toBe(false);
    expect(result.tied).toBe(true);
    expect(engine.tied).toBe(true);
    expect(engine.winner).toBeUndefined();
  });

  it('detects a completing move as a win', () => {
    // z = 0 is a geometric plane passing through the cube center.
    const plane = centralPlane(
      engine,
      point => point.z === 0,
    );

    expect(plane.length).toBe(
      engine.cubeSize * engine.cubeSize - 1,
    );

    const target = plane[0];

    const partnerKey = new Point3(
      -target.x,
      -target.y,
      -target.z,
    ).toString();

    for (const point of plane) {
      if (
        point.toString() === target.toString() ||
        point.toString() === partnerKey
      ) {
        continue;
      }

      engine.cubeletAt(
        point.x,
        point.y,
        point.z,
      ).player = 'red';
    }

    const result = engine.playerSelectCubelet(
      'red',
      target.x,
      target.y,
      target.z,
    );

    expect(result.accepted).toBe(true);
    expect(result.won).toBe(true);
    expect(result.tied).toBe(false);
    expect(result.player).toBe('red');
  });
});
