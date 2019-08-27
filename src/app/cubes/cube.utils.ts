
export function isPrime( n: number ): boolean {
    for ( let i = 2; i * i <= n; i++ ) {
        if ( n % i === 0 ) {
            return false;
        }
    }
    return n > 1;
}

export function sortedIndexesArray( a: Array<number>): Array<number> {
    return a.map( function( e, i ) {
        return [e, i];
    } ).sort(( a, b ) => a[0] - b[0] ).map( x => x[1] );
}
