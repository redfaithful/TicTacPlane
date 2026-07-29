import {Cube} from './cube.model';

describe('Cube model', () => {
  it('should create a cube with the requested prime length', () => {
    const cube = new Cube(3);

    expect(cube.length).toBe(3);
    expect(cube.prime).toBeTrue();
  });

  it('should reject a non-prime cube length', () => {
    expect(() => new Cube(4)).toThrowError(
      Error,
      'Cube length must be prime number',
    );
  });
});
