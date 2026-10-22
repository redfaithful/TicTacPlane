import {isPrime} from './cube.utils';
import {sortedIndexesArray} from './cube.utils';

describe('Utils isPrime', () => {

  it('should return correctly for different numbers', () => {
    expect(isPrime(3)).toBe(true);
    expect(isPrime(4)).toBe(false);
  });
});

describe('Utils sortedIndexesArray', () => {

  it('should return correct indexes order', () => {
    const arr = [3, 5, 1];
    const sorted = sortedIndexesArray(arr);
    expect(sorted).toEqual([2, 0, 1]);
  });
});
