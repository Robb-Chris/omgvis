# OmgVis: Visualizing Prime Factor Depth Ω(n) & The Erdős–Kac Theorem

OmgVis is an interactive WebGL visualization tool for exploring prime factor depth $\Omega(n)$, prime and composite duality, and the limit distribution of prime factors predicted by the Erdős–Kac Theorem.

---

## Mathematical Background

### Prime Factor Depth $\Omega(n)$
For any integer $n > 1$ with prime factorization $n = p_1^{a_1} p_2^{a_2} \dots p_k^{a_k}$, the prime factor depth $\Omega(n)$ counts the total number of prime factors with multiplicity:

$$\Omega(n) = \sum_{i=1}^k a_i$$

- **Primes ($\Omega(n) = 1$):** Pure building blocks of integers (e.g., $2, 3, 5, 7$).
- **Composites ($\Omega(n) \ge 2$):** Numbers formed by multiplying multiple prime factors (e.g., $15 = 3 \times 5$, so $\Omega(15) = 2$).

### The Erdős–Kac Theorem
The Erdős–Kac Theorem states that if $n$ is chosen uniformly at random from $\{1, \dots, N\}$, the normalized prime depth distribution converges to a standard Gaussian distribution as $N \to \infty$:

$$\lim_{N \to \infty} \mathbb{P}\left(\frac{\Omega(n) - \ln\ln N}{\sqrt{\ln\ln N}} \le x\right) = \frac{1}{\sqrt{2\pi}} \int_{-\infty}^x e^{-t^2/2} \, dt$$

The mean and standard deviation of $\Omega(n)$ for $n \le N$ are given by:

$$\mu = \ln(\ln N), \quad \sigma = \sqrt{\ln(\ln N)}$$

---

## Features

- **Multi-Layout Spatial Projections:**
  - **Erdős–Kac Depth Shells:** Concentric rings grouped by prime factor depth $\Omega(n)$.
  - **Sacks Polar Spiral:** Archimedean spiral mapped by polar coordinates $r = \sqrt{n-1}$ and $\theta = 2\pi \sqrt{n-1}$.
  - **Classic Ulam Square Grid:** 2D square spiral revealing 45° polynomial prime alignment.
- **WebGL Rendering Pipeline:** Utilizes Three.js `InstancedMesh` and `LineSegments` to project integer nodes and factor edges across ranges $N = 100$ to $N = 5 \times 10^6$.
- **Additive Factor Sieve Worker:** Multi-threaded $\Omega(n)$ computation running in a Web Worker using zero-copy `ArrayBuffer` transfer, with synchronous in-memory evaluation for $N \le 10,000$.
- **Interactive Depth Ω Spotlighting:** Click any bar on the Erdős–Kac distribution histogram to isolate numbers with that factor depth while dimming remaining network nodes.
- **Duality Filtering:** Toggle display between All Numbers, Primes Only ($\Omega = 1$), and Composites Only ($\Omega \ge 2$).
- **Statistical Gaussian Fit:** Real-time Gaussian probability density function curve $\mathcal{N}(\mu, \sigma^2)$ overlaid on empirical factor depth frequencies.
- **Educational Walkthrough:** 5-step guided tutorial covering prime depth fundamentals, spiral patterns, the Erdős–Kac distribution, depth spotlighting, and spatial layouts.

---

## Local Setup

```bash
npm install
npm run dev
```
