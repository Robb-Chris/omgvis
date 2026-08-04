/**
 * Math Engine for Prime Factor Depth Omega(n) & Erdős-Kac Theorem
 */

export type LayoutType = 'sacks' | 'ulam' | 'shells';

/**
 * Computes prime depth Ω(n) for integers 1..maxN using an additive sieve.
 */
export function computeAdditiveSieve(maxN: number): Uint8Array {
  const N = Math.max(1, Math.min(5000000, maxN));
  const omega = new Uint8Array(N + 1); // 1-indexed

  for (let p = 2; p <= N; p++) {
    if (omega[p] === 0) {
      // Prime number p
      for (let m = p; m <= N; m += p) {
        omega[m] += 1;
      }
      let pk = p * p;
      while (pk <= N && pk > 0) {
        for (let m = pk; m <= N; m += pk) {
          omega[m] += 1;
        }
        pk *= p;
      }
    }
  }
  return omega;
}

/**
 * Sacks Polar Spiral with n=1 at dead center (0, 0)
 */
export function generateSacksSpiral(maxN: number, spacing = 25.0): Float32Array {
  const N = Math.max(1, Math.min(5000000, maxN));
  const coords = new Float32Array(N * 2);

  // n = 1 at dead center (0, 0)
  coords[0] = 0;
  coords[1] = 0;

  for (let n = 2; n <= N; n++) {
    const sqrtN = Math.sqrt(n - 1);
    const theta = 2 * Math.PI * sqrtN;
    const r = spacing * sqrtN;

    coords[(n - 1) * 2] = r * Math.cos(theta);
    coords[(n - 1) * 2 + 1] = r * Math.sin(theta);
  }

  return coords;
}

/**
 * Classic Ulam Square Grid Spiral with n=1 at dead center (0, 0)
 */
export function generateUlamSquareSpiral(maxN: number, spacing = 16.0): Float32Array {
  const N = Math.max(1, Math.min(5000000, maxN));
  const coords = new Float32Array(N * 2);

  // n = 1 at dead center (0, 0)
  coords[0] = 0;
  coords[1] = 0;

  let x = 0;
  let y = 0;
  let dx = 1;
  let dy = 0;

  let segmentLength = 1;
  let segmentPassed = 0;
  let turnCount = 0;

  for (let n = 2; n <= N; n++) {
    x += dx;
    y += dy;
    segmentPassed++;

    coords[(n - 1) * 2] = x * spacing;
    coords[(n - 1) * 2 + 1] = y * spacing;

    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      const temp = dx;
      dx = -dy;
      dy = temp;

      turnCount++;
      if (turnCount % 2 === 0) {
        segmentLength++;
      }
    }
  }

  return coords;
}

/**
 * Concentric Depth Shells Layout with n=1 at dead center (0, 0)
 */
export function generateDepthShellsLayout(maxN: number, omegaData: Uint8Array, spacing = 40.0): Float32Array {
  const N = Math.max(1, Math.min(5000000, maxN));
  const coords = new Float32Array(N * 2);

  // n = 1 at dead center (0, 0)
  coords[0] = 0;
  coords[1] = 0;

  for (let n = 2; n <= N; n++) {
    const w = omegaData[n] || 0;
    const r = (w + 1) * spacing;
    const theta = ((n - 2) / Math.max(1, N - 2)) * 2 * Math.PI * 8.0;

    coords[(n - 1) * 2] = r * Math.cos(theta);
    coords[(n - 1) * 2 + 1] = r * Math.sin(theta);
  }

  return coords;
}

/**
 * Helper to generate coordinates based on selected LayoutType
 */
export function generateGraphCoordinates(
  layoutType: LayoutType,
  maxN: number,
  omegaData: Uint8Array
): Float32Array {
  switch (layoutType) {
    case 'ulam':
      return generateUlamSquareSpiral(maxN, 16.0);
    case 'shells':
      return generateDepthShellsLayout(maxN, omegaData, 40.0);
    case 'sacks':
    default:
      return generateSacksSpiral(maxN, 25.0);
  }
}

export const generateUlamSpiral = generateSacksSpiral;

/**
 * Prime Factorization helper returning prime factors with multiplicities for integer N.
 */
export function getPrimeFactors(n: number): { factor: number; count: number }[] {
  if (n <= 1) return [];
  const factors: { factor: number; count: number }[] = [];
  let temp = n;

  for (let d = 2; d * d <= temp; d++) {
    if (temp % d === 0) {
      let count = 0;
      while (temp % d === 0) {
        count++;
        temp = Math.floor(temp / d);
      }
      factors.push({ factor: d, count });
    }
  }
  if (temp > 1) {
    factors.push({ factor: temp, count: 1 });
  }

  return factors;
}

export const factorize = getPrimeFactors;

/**
 * Checks if N can be expressed as integer power base b^x (x >= 2)
 */
export function evaluatePowerBase(
  n: number,
  factors = getPrimeFactors(n)
): { isPowerBase: boolean; base?: number; exponent?: number } {
  if (n <= 3 || factors.length === 0) return { isPowerBase: false };

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  let commonExponent = factors[0].count;

  for (let i = 1; i < factors.length; i++) {
    commonExponent = gcd(commonExponent, factors[i].count);
  }

  if (commonExponent >= 2) {
    let base = 1;
    for (const f of factors) {
      base *= Math.pow(f.factor, f.count / commonExponent);
    }
    return { isPowerBase: true, base, exponent: commonExponent };
  }

  return { isPowerBase: false };
}

/**
 * Formats prime factorization as math string e.g. 2² × 3¹ = 12
 */
export function formatFactorization(n: number): string {
  if (n === 1) return '1 (Unity)';
  const factors = getPrimeFactors(n);
  const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  const toSuper = (num: number) =>
    num
      .toString()
      .split('')
      .map((digit) => superscripts[parseInt(digit, 10)] || digit)
      .join('');

  return factors.map((f) => `${f.factor}${toSuper(f.count)}`).join(' × ');
}

/**
 * Calculates Erdős-Kac theoretical mean μ = ln(ln N) and std dev σ = √(ln(ln N))
 */
export function erdosKacParams(n: number): { mu: number; sigma: number } {
  const safeN = Math.max(3, n);
  const logLogN = Math.log(Math.log(safeN));
  const mu = Math.max(0.1, logLogN);
  const sigma = Math.sqrt(mu);
  return { mu, sigma };
}

/**
 * Theoretical Gaussian PDF for N(mu, sigma^2)
 */
export function gaussianPDF(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const factor = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
  return factor * Math.exp(exponent);
}
