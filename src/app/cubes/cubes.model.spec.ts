import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import { isPrime } from './cube.utils';

describe('Utils isPrime', () => {

  it('should return correctly for different numbers', () => {
      expect(isPrime(3)).to.be.true;
      expect(isPrime(4)).to.be.false;
  })
});
