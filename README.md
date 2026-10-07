# ASTRA AI project website

A frontend-only React + Vite + Tailwind 4 prototype for **Atmospheric State Reconstruction and Temporal Super-Resolution**. GSAP and Lenis provide scroll motion. Satellite-like cloud fields are generated in a WebGL fragment shader. The site does not fetch GOES-16 imagery or run a reconstruction model.

## Run locally

```bash
npm install
npm run dev
```

Vite prints a local URL. Create an optimized build with `npm run build` and inspect it using `npm run preview`.

## Routes

- `/` project overview and method narrative
- `/demo` interactive synthetic reconstruction dashboard
- `/privacy` privacy policy
- `/terms` terms and conditions

## Replace placeholder metrics

Edit `src/data/metrics.js`. Replace `N/A` values only with results from documented experiments, and update the `status` text to describe their provenance. The demo does not currently calculate MSE, PSNR, SSIM, SRI, confidence, or the 65% quality gate. Update the interface before presenting any values as measured results.

## Prototype limitations

Frame imagery and overlays are synthetic illustrations. Metrics and diagnostic outputs are intentionally marked not available or not computed. The downloadable `public/astra-prototype-mock.nc` is a valid NetCDF3 Classic file with missing-value arrays and metadata identifying it as synthetic. No backend, data collection form, real satellite data, or deployed inference pipeline is included. See `/privacy` and `/terms` for the prototype notices.
