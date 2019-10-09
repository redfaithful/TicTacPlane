import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import 'core-js/es6/reflect';

import { GameComponent } from './game.component';

describe( 'GameComponent', () => {
    let component: GameComponent;
    let fixture: ComponentFixture<GameComponent>;

    beforeEach( async(() => {
        TestBed.configureTestingModule( {
            declarations: [GameComponent]
        } )
            .compileComponents();
    } ) );

    beforeEach(() => {
        fixture = TestBed.createComponent( GameComponent );
        component = fixture.componentInstance;
        fixture.detectChanges();
    } );

    it( 'should be created', () => {
        expect( component.cube.length ).to.equal( 3 );
    } );

    it( 'should correctly set cubelet attribute', () => {
        const cubelet000 = component.cube.cubeletAt( 0, 0, 0 );
        expect( cubelet000['color'] ).to.be.an( 'undefined' );
        cubelet000['color'] = 'red';
        const cubelet000again = component.cube.cubeletAt( 0, 0, 0 );
        expect( cubelet000again['color'] ).to.equal( 'red' );
    } );
    
    it( 'should correctly change turn and return the right player number', () => {
        expect( component.playTurn( 1, 1, 1 ) ).to.be.equal( true );
        expect( component.playTurn( 1, 1, 1 ) ).to.be.equal( false );
        expect(component.turn).to.be.equal( 1 );
        expect( component.playTurn( -1, 0, -1 ) ).to.be.equal( true );
        expect(component.turn).to.be.equal( 2 );
    } );
}
);
