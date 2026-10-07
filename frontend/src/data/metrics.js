// Replace these explicitly marked prototype placeholders with validated experiment results.
export const PLACEHOLDER_METRICS = {
  status: 'PLACEHOLDER · NOT MEASURED',
  methods: {
    Linear: { psnr: 'N/A', ssim: 'N/A', mse: 'N/A', sri: 'N/A' },
    Farneback: { psnr: 'N/A', ssim: 'N/A', mse: 'N/A', sri: 'N/A' },
    RAFT: { psnr: 'N/A', ssim: 'N/A', mse: 'N/A', sri: 'N/A' },
    'ASTRA (refined)': { psnr: 'N/A', ssim: 'N/A', mse: 'N/A', sri: 'N/A' }
  }
};
export const STAGES = [
  ['01', 'Calibrate', 'Counts → radiance → brightness temperature. Normalize 256 × 256 patches.'],
  ['02', 'Estimate motion', 'Bidirectional flow with Farneback or RAFT-Small.'],
  ['03', 'Warp both frames', 'Advect the observed fields toward the requested time.'],
  ['04', 'Refine residuals', 'Residual U-Net learns what motion compensation misses.'],
  ['05', 'Score reliability', 'Confidence map and a Scientific Reliability Index.'],
  ['06', 'Export', 'Intermediate field and diagnostics in NetCDF.']
];
