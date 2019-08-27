import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import { isPrime } from './cube.utils';
import { sortedIndexesArray } from './cube.utils';

describe( 'Utils isPrime', () => {

    it( 'should return correctly for different numbers', () => {
        expect( isPrime( 3 ) ).to.be.true;
        expect( isPrime( 4 ) ).to.be.false;
    } )
} );

describe( 'Utils sortedIndexesArray', () => {

    it( 'should return correct indexes order', () => {
        const arr = [3, 5, 1];
        const sorted = sortedIndexesArray( arr );
        expect( sorted ).to.eql( [2, 0, 1] );
    } )
} );
