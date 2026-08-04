# OmgVis: Visualizing Prime Factor Depth & The Erdős–Kac Theorem

OmgVis is an interactive, high-performance WebGL and TypeScript visualization platform designed to explore prime factor depth ($\Omega(n)$), prime vs. composite duality, and the emergent Gaussian bell curve of prime factors predicted by the Erdős–Kac Theorem.

---

## Key Features

- **High-Throughput WebGL Engine:** Render $10^2$ to $5 \times 10^6+$ integers seamlessly at 60 FPS on an Ulam spiral layout using Three.js `InstancedMesh`.
- **Additive Sieve Worker:** Multi-threaded $\Omega(n)$ prime factor depth sieve running in a Web Worker using zero-copy `Transferable` `ArrayBuffer`.
- **Logarithmic Scale Slider:** Real-time scaling along $N$ to observe prime gap widening and composite depth shifts upward.
- **Duality Filtering:** Toggle between **Combined View**, **Primes Only** ($\Omega = 1$), and **Composites Only** ($\Omega \ge 2$).
- **Analytical Overlay:** Real-time Gaussian curve ($\mathcal{N}(\mu, \sigma^2)$) fitted over the empirical histogram using $\mu = \ln(\ln N)$ and $\sigma = \sqrt{\ln(\ln N)}$.
- **Number Inspector & Base Solver:** Click or hover any integer point to view its prime factorization tree and evaluate integer power base validity ($N = b^x$ iff $\gcd(a_1, \dots, a_k) > 1$).
- **Design System:** Modeled after [Chris Robb's Portfolio](https://github.com/Robb-Chris/portfolio) — featuring `Outfit` + `Inter` typography, adaptive Light/Dark themes, glassmorphism UI panels, and a Google Minimalist spectral color palette.

---

## Setup & Running

```bash
npm install
npm run dev
```
