import {AiPlayer} from './ai.player';
import {GameEngine} from './game.engine';
import {Point3} from './cube.model';

function centralPlane(
  engine: GameEngine,
  predicate: (point: Point3) => boolean,
): Point3[] {
  return engine.cubeletsArray.filter(predicate);
}

function symmetricKey(point: Point3): string {
  return new Point3(
    -point.x,
    -point.y,
    -point.z,
  ).toString();
}

describe('AiPlayer', () => {
  it('takes an immediate winning move', () => {
    const engine = new GameEngine();
    const plane = centralPlane(engine, point => point.z === 0,);

    const target = plane[0];
    const partnerKey = symmetricKey(target);

    // Red owns the whole plane except one empty symmetric pair.
    for (const p of plane) {
      if (p.toString() === target.toString() || p.toString() === partnerKey) {
        continue;
      }
      engine.cubeletAt(p.x, p.y, p.z).player = 'red';
    }
    engine.updateRiskFactor('red');

    const move = new AiPlayer('hard').chooseMove(engine, 'red');
    expect(move).toBeDefined();

    const result = engine.playerSelectCubelet('red', move!.x, move!.y, move!.z);
    expect(result.won).toBeTrue();
  });

  it('blocks an opponent about to win', () => {
    const engine = new GameEngine();
    const plane = centralPlane(engine, point => point.z === 0,);

    const target = plane[0];
    const partnerKey = symmetricKey(target);

    // Blue threatens to complete the plane; red (to move) has no win of its own.
    for (const p of plane) {
      if (p.toString() === target.toString() || p.toString() === partnerKey) {
        continue;
      }
      engine.cubeletAt(p.x, p.y, p.z).player = 'blue';
    }
    engine.updateRiskFactor('blue');

    const move = new AiPlayer('hard').chooseMove(engine, 'red');
    expect(move).toBeDefined();
    // The only way to deny blue is to occupy the open pair.
    expect([target.toString(), partnerKey]).toContain(move!.toString());
  });

  it('returns undefined when the board is full', () => {
    const engine = new GameEngine();
    for (const p of engine.cubeletsArray) {
      engine.cubeletAt(p.x, p.y, p.z).player = 'red';
    }
    expect(new AiPlayer('hard').chooseMove(engine, 'blue')).toBeUndefined();
  });

  it('does not select the cube center', () => {
    const engine = new GameEngine();

    for (const point of engine.cubeletsArray) {
      engine.cubeletAt(
        point.x,
        point.y,
        point.z,
      ).player = 'red';
    }

    expect(
      engine.cubeletAt(0, 0, 0).player,
    ).toBeUndefined();

    const move = new AiPlayer('hard').chooseMove(
      engine,
      'blue',
    );

    expect(move).toBeUndefined();
  });

  it('uses only complete central planes', () => {
    const engine = new GameEngine();

    expect(engine.scoringPlanes.length).toBeGreaterThan(0);

    for (const plane of engine.scoringPlanes) {
      expect(plane.length).toBe(
        engine.cubeSize * engine.cubeSize - 1,
      );
    }
  });

  it('does not count an incomplete central plane as a win', () => {
    const engine = new GameEngine();

    /*
     * x + y + 2z = 0 passes through the center but intersects only
     * a small subset of the size-3 cube. It must not be a scoring plane.
     */
    const smallCentralSet = engine.cubeletsArray.filter(point =>
      point.x + point.y + 2 * point.z === 0,
    );

    expect(smallCentralSet.length).toBeLessThan(
      engine.cubeSize * engine.cubeSize - 1,
    );

    for (const point of smallCentralSet) {
      engine.cubeletAt(
        point.x,
        point.y,
        point.z,
      ).player = 'blue';
    }

    expect(engine.updateRiskFactor('blue')).toBeFalse();
  });
});
