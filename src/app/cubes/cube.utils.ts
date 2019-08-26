
export function isPrime( n: number ): boolean {
    for ( let i = 2; i * i <= n; i++ ) {
        if ( n % i === 0 ) {
            return false;
        }
    }
    return n > 1;
}

