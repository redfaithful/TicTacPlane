import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Cube, Point3 } from './cube.model';
import { PolarAngels } from './game.utils';

@Component( {
    selector: 'app-cubes',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.css']
} )

export class GameComponent implements OnInit {
    cube: Cube;
    cubeletsArray: Point3[];
    defaultColour= 'Silver';
    players: string[] = ['Blue', 'Red'];
    turn = 0;
    cubeSize = 3;
    cubeTransformSize: number;
    mouse = {
        down: false,
        x: 0,
        y: 0
    };
    public mouseTracking: PolarAngels;
    constructor() { }

    ngOnInit() {
        this.cube = new Cube( this.cubeSize, this.defaultColour );
        this.cubeTransformSize = (this.cubeSize - 1) / 2;
        this.cubeletsArray = this.cube.cubeletsArray();
    }

    playerSelectCubelet( player: string, x: number, y: number, z: number ): boolean {
        const cubelet: object = this.cube.cubeletAt( x, y, z );
        if ( cubelet['player'] === this.defaultColour ) {
            cubelet['player'] = player;
            const symmetryCubelet: object = this.cube.cubeletAt( Cube.symmetry( x ), Cube.symmetry( y ), Cube.symmetry( z ) );
            symmetryCubelet['player'] = player;
            return true;
        } else {
            return false;
        }
    }

    getCubeSize(): number {
        return this.cubeSize;
    }
    printAttribute( attr: string ) {
        this.cube.printAttrbiute( attr );
    }

    playTurn( x: number, y: number, z: number ): boolean {
        if ( this.playerSelectCubelet( this.players[this.turn % 2], x, y, z ) ) {
            this.turn += 1;
            return true;
        } else {
            return false;
        }
    }
    mousePress( event ) {
        this.mouse.down = true;
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }

    mouseMove( event ) {
        if ( this.mouse.down ) {
            const distance = ( event.clientX - this.mouse.x ) * ( event.clientX - this.mouse.x )
                + ( event.clientY - this.mouse.y ) * ( event.clientY - this.mouse.y );
            if ( distance > 16 ) {
                const theta = ( event.clientX - this.mouse.x ) * Math.PI / -720;
                const phi = ( event.clientY - this.mouse.y ) * Math.PI / -360;
                this.mouseTracking = new PolarAngels( theta, phi );
                this.mouse.x = event.clientX;
                this.mouse.y = event.clientY;
                this.reorderCubelets();
            }
        }
    }

    mouseRelease( event ) {
        setTimeout(() => { this.mouse.down = false; }, 100 );
    }

    reorderCubelets(): any {
        const wrapper = document.getElementsByClassName( 'game-component' )[0];
        const items = Array.prototype.slice.call( wrapper.children );
        const zIndexArr = wrapper['textContent'].trim().split( ' ' )
            .map( z => parseInt( z, 10 ) ).map( function( e, i ) {
                return [e, i];
            } ).sort(( a, b ) => a[0] - b[0] ).map( x => x[1] );

        for ( const i in items ) {
            const item = items[zIndexArr[i]];
            const parent = item.parentNode;
            const detatchedItem = parent.removeChild( item );
            parent.appendChild( detatchedItem );
        }
    }

    getOffsetX( p: Point3 ): string {
        return p.x.toString();
    }

    getOffsetY( p: Point3 ): string {
        return p.y.toString();
    }

    getOffsetZ( p: Point3 ): string {
        return p.z.toString();
    }

    select( p: Object ) {
        this.playTurn( parseInt( p['x'], 10 ), parseInt( p['y'], 10 ), parseInt( p['z'], 10 ) );
    }

    getCubeletColour( p: Point3 ): string {
        return this.cube.cubelets[p.x + this.cubeTransformSize][p.y + this.cubeTransformSize][p.z + this.cubeTransformSize]['player'];
    }

}
