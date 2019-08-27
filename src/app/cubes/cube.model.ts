import { isPrime } from './cube.utils';

export class Point2 {
    x: number;
    y: number;
    constructor( x: number, y: number ) {
        this.x = x;
        this.y = y;
    }
}

export class Point3 extends Point2 {
    z: number;
    constructor( x: number, y: number, z: number ) {
        super( x, y );
        this.z = z;
    }
}

export class Cube {
    length: number;
    prime: boolean;
    cubelets: object[][][];
    transformValue: number;

    static symmetry( n: number ): number {
        return -n;
    }

    constructor( length: number ) {
        this.prime = isPrime( length );
        if ( !isPrime( length ) ) {
            throw new Error( 'Cube length must be prime number' );
        }
        this.length = length;
        this.transformValue = ( ( this.length - 1 ) / 2 );
        this.cubelets = [];
        for ( let i = 0; i < length; i++ ) {
            this.cubelets[i] = [];
            for ( let j = 0; j < length; j++ ) {
                this.cubelets[i][j] = [];
                for ( let k = 0; k < length; k++ ) {
                    this.cubelets[i][j][k] = { };
                }
            }
        }
    }

    cubeletsArray(): Point3[] {
        const cubletesArr: Point3[] = [];
        for ( let i = 0; i < this.length; i++ ) {
            for ( let j = 0; j < this.length; j++ ) {
                for ( let k = 0; k < this.length; k++ ) {
                    if ( i === 0 || i === this.length - 1 ||
                        j === 0 || j === this.length - 1 ||
                        k === 0 || k === this.length - 1 ) {
                        cubletesArr.push( new Point3( i - this.transformValue, j - this.transformValue, k - this.transformValue ) );
                    }
                }
            }
        }
        return cubletesArr;
    }

    cubeletAt( x: number, y: number, z: number ): object {
        const newX = this.transform( x );
        const newY = this.transform( y );
        const newZ = this.transform( z );
        if ( !Number.isInteger( newX ) || !Number.isInteger( newY ) || !Number.isInteger( newZ ) ||
            newX >= this.length || newY >= this.length || newZ >= this.length ||
            newX < 0 || newY < 0 || newZ < 0 ) {
            throw new RangeError( 'Illegal index given to method cubeletAt' );
        }
        return this.cubelets[newX][newY][newZ];
    }

    transform( n: number ): number {
        n = n + this.transformValue;
        return n;
    }

    printAttrbiute( attr: string ) {
        for ( let i = 0; i < this.length; i++ ) {
            // console.log(i);
            let spacing = '';
            for ( let j = 0; j < this.length; j++ ) {
                let row: string = spacing;
                spacing = spacing + '    ';
                for ( let k = 0; k < this.length; k++ ) {
                    row = row + this.cubelets[i][j][k][attr] + '  ';
                }
                console.log( row );
            }
        }
    }
}

