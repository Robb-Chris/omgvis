/**
 * Web Worker for Ω(n) Additive Prime Omega Sieve computation.
 */

self.onmessage = (e: MessageEvent<{ maxN: number }>) => {
  const { maxN } = e.data;
  const startTime = performance.now();

  const N = Math.max(1, Math.min(5000000, maxN));
  const omega = new Uint8Array(N + 1); // 1-indexed

  // Modified Sieve of Eratosthenes to accumulate Ω(n)
  // For each prime p, increment omega for all multiples p, 2p, 3p...
  // For higher prime powers p^k, increment again for multiples of p^k.

  for (let p = 2; p <= N; p++) {
    if (omega[p] === 0) {
      // p is prime!
      // Add count 1 for all multiples of p
      for (let m = p; m <= N; m += p) {
        omega[m] += 1;
      }
      // Add extra factor counts for higher prime powers p^2, p^3, etc.
      let pk = p * p;
      while (pk <= N && pk > 0) {
        for (let m = pk; m <= N; m += pk) {
          omega[m] += 1;
        }
        pk *= p;
      }
    }
  }

  const elapsedMs = performance.now() - startTime;

  // Send result back using zero-copy Transferable ArrayBuffer
  self.postMessage(
    {
      type: 'result',
      maxN: N,
      omega: omega.buffer,
      elapsedMs,
    },
    [omega.buffer] as unknown as Transferable[]
  );
};
