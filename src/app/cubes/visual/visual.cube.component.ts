import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { Point3, Point2 } from '../cube.model';
import { OnInit } from '@angular/core';
import { SimpleChange } from '@angular/core';
import { PolarAngels } from '../game.utils';

@Component( {
    selector: '[visual-cube]',
    templateUrl: './visual.cube.component.html',
    styleUrls: ['./visual.cube.component.css'],
} )

export class VisualCubeComponent implements OnInit {
    vertices: Point3[];
    faces: Point3[][];
    spacing = 0;
    origin: Point3;
    center: Point3;

    zIndex: number;

    @Input()
    xLocation: number;

    @Input()
    yLocation: number;

    @Input()
    size: number;

    @Input()
    centerX: number;

    @Input()
    centerY: number;

    @Input()
    centerZ: number;

    @Input()
    offsetX: number;

    @Input()
    offsetY: number;

    @Input()
    offsetZ: number;

    @Input()
    colour: string;

    @Input()
    mouseTracking: PolarAngels;

    @Input()
    length: number;

    @Output()
    selectionEvent = new EventEmitter();

    mathLength = 0;
    ngOnInit() {
        this.mathLength = ( this.length - 1 ) / 2;
        const d = this.size / 2;
        this.origin = new Point3( this.centerX, this.centerY, this.centerZ );
        const center = new Point3( this.centerX + this.offsetX * ( this.size + this.spacing ),
            this.centerY + this.offsetY * ( this.size + this.spacing ),
            this.centerZ + this.offsetZ * ( this.size + this.spacing ) );
        this.vertices = [
            new Point3( center.x + d, center.y + d, center.z + d ),
            new Point3( center.x + d, center.y + d, center.z - d ),
            new Point3( center.x + d, center.y - d, center.z + d ),
            new Point3( center.x + d, center.y - d, center.z - d ),
            new Point3( center.x - d, center.y + d, center.z + d ),
            new Point3( center.x - d, center.y + d, center.z - d ),
            new Point3( center.x - d, center.y - d, center.z + d ),
            new Point3( center.x - d, center.y - d, center.z - d )
        ];
        this.faces = [];
        if ( this.offsetX >= this.mathLength ) {
            this.faces.push( [this.vertices[0], this.vertices[1], this.vertices[3], this.vertices[2]] );
        }
        if ( this.offsetX <= -this.mathLength ) {
            this.faces.push( [this.vertices[4], this.vertices[5], this.vertices[7], this.vertices[6]] );
        }
        if ( this.offsetY >= this.mathLength ) {
            this.faces.push( [this.vertices[0], this.vertices[1], this.vertices[5], this.vertices[4]] );
        }
        if ( this.offsetY <= -this.mathLength ) {
            this.faces.push( [this.vertices[2], this.vertices[3], this.vertices[7], this.vertices[6]] );
        }
        if ( this.offsetZ >= this.mathLength ) {
            this.faces.push( [this.vertices[0], this.vertices[2], this.vertices[6], this.vertices[4]] );
        }
        if ( this.offsetZ <= -this.mathLength ) {
            this.faces.push( [this.vertices[1], this.vertices[3], this.vertices[7], this.vertices[5]] );
        }

        this.center = center;
        this.zIndex = center.z;
    }

    rotate( vertice, center, theta: number, phi: number ) {
        const ct = Math.cos( theta );
        const st = Math.sin( theta );
        const cp = Math.cos( phi );
        const sp = Math.sin( phi );

        const x = vertice.x - center.x;
        const y = vertice.y - center.y;
        const z = vertice.z - center.z;

        vertice.x = ct * x - st * cp * y + st * sp * z + center.x;
        vertice.y = st * x + ct * cp * y - ct * sp * z + center.y;
        vertice.z = sp * y + cp * z + center.z;
    }

    project( vertice: Point3 ) {
        return new Point2( vertice.x, vertice.z );
    }

    buildPath( facePoints: Point3[] ): string {
        const path = 'M ' + facePoints.map( point => this.getCoordinates( point ) ).join( ' L ' ) + ' Z';
        return path;
    }

    getCoordinates( point3: Point3 ): string {
        const point2 = this.project( point3 );
        return `${point2.x + this.xLocation} ${-point2.y + this.yLocation}`;
    }

    sortArray( facesOrder: Array<number> ) {
        const allCubes = Array.prototype.slice.call( document.querySelectorAll( '[visual-cube]' ) );
        const myCubeElement = allCubes.find(( cubeElement: any ) => {
            const offsetX = cubeElement.attributes['ng-reflect-offset-x'].value;
            const offsetY = cubeElement.attributes['ng-reflect-offset-y'].value;
            const offsetZ = cubeElement.attributes['ng-reflect-offset-z'].value;
            return ( offsetX === this.offsetX && offsetY === this.offsetY && offsetZ === this.offsetZ );
        } );

        const items = Array.prototype.slice.call( myCubeElement.children );
        const newfaces = [];
        for ( const i in items ) {
            const item = items[facesOrder[i]];
            const parent = item.parentNode;
            const detatchedItem = parent.removeChild( item );
            parent.appendChild( detatchedItem );
            newfaces.push( this.faces[facesOrder[i]] )
        }
        this.faces = newfaces;
    }

    ngOnChanges( changes: { [property: string]: SimpleChange } ) {
        const change: SimpleChange = changes['mouseTracking'];
        if ( change ) {
            const currentAngels: PolarAngels = change.currentValue;
            if ( !change.isFirstChange() ) {
                this.rotate( this.center, this.origin, currentAngels.theta, currentAngels.phi );
                this.zIndex = Math.round( this.center.y );
                if ( this.faces.length >= 2 ) {
                    const facesZ = [];
                    for ( const i in this.faces ) {
                        let sumZ = 0;
                        for ( const j in this.faces[i] ) {
                            sumZ = sumZ + Math.round( this.faces[i][j].y );
                        }
                        facesZ.push( sumZ );
                    }
                    const facesOrder = facesZ.map( function( e, i ) {
                        return [e, i];
                    } ).sort(( a, b ) => a[0] - b[0] ).map( x => x[1] );

                    this.sortArray( facesOrder );
                }

                for ( const i in this.vertices ) {
                    this.rotate( this.vertices[i], this.origin, currentAngels.theta, currentAngels.phi );
                }
            }
        }
    }

    test( event ) {
        const p = new Point3( this.offsetX, this.offsetY, this.offsetZ );
        this.selectionEvent.emit( p );
    }

}
