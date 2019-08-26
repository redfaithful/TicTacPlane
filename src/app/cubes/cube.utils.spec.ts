import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import { Cube } from './cube.model';

describe('Cubes Model', () => {

  it('should return correctly for different numbers', () => {
      const cube3 = new Cube(3);
      expect(cube3.length).to.equal(3);
      let errorConstructor = function () {new Cube(4);}
      expect(errorConstructor).to.throw(Error, 'Cube length must be prime number');
  })
});
