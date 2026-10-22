import {Cube} from './cube.model';

describe('Cube model', () => {
  it('should create a cube with the requested prime length', () => {
    const cube = new Cube(3);

    expect(cube.length).toBe(3);
    expect(cube.prime).toBe(true);
  });

  it('should reject a non-prime cube length', () => {
    expect(() => new Cube(4)).toThrowError(new Error('Cube length must be prime number'));
  });
});
