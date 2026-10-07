// Simulated benchmark results and project pipeline data for ASTRA AI prototype
export const PLACEHOLDER_METRICS = {
  status: 'SIMULATED BENCHMARK · SYNTHETIC TEST RESULTS',
  methods: {
    Linear: { psnr: '26.42', ssim: '0.812', mse: '0.048', sri: '41.8%', latency: '11 ms', convectiveError: '28.4%' },
    Farneback: { psnr: '29.85', ssim: '0.865', mse: '0.031', sri: '68.2%', latency: '36 ms', convectiveError: '18.7%' },
    RAFT: { psnr: '32.18', ssim: '0.908', mse: '0.019', sri: '78.4%', latency: '82 ms', convectiveError: '12.3%' },
    'ASTRA (refined)': { psnr: '36.45', ssim: '0.957', mse: '0.008', sri: '92.6%', latency: '94 ms', convectiveError: '4.6%' }
  }
};

export const BENCHMARK_COMPARISON = [
  {
    name: 'Linear Interpolation',
    category: 'Baseline',
    methodology: 'Direct Pixel Cross-Fade',
    psnr: '26.42 dB',
    ssim: '0.812',
    mse: '0.0482',
    sri: '41.8%',
    latency: '11 ms',
    reliability: 'Poor (Severe Ghosting)',
    isOurs: false
  },
  {
    name: 'Farneback Flow',
    category: 'Classical Optical Flow',
    methodology: 'Dense Polynomial Advection',
    psnr: '29.85 dB',
    ssim: '0.865',
    mse: '0.0314',
    sri: '68.2%',
    latency: '36 ms',
    reliability: 'Moderate (Motion Bleed)',
    isOurs: false
  },
  {
    name: 'RAFT-Small (Flow-Only)',
    category: 'Deep Learning Flow',
    methodology: 'Recurrent All-Pairs Field Warping',
    psnr: '32.18 dB',
    ssim: '0.908',
    mse: '0.0189',
    sri: '78.4%',
    latency: '82 ms',
    reliability: 'Good (Fails on Convective Growth)',
    isOurs: false
  },
  {
    name: 'ASTRA AI (Refined)',
    category: 'Our Proposed Framework',
    methodology: 'Bidirectional RAFT + Residual U-Net + SRI Gate',
    psnr: '36.45 dB',
    ssim: '0.957',
    mse: '0.0084',
    sri: '92.6%',
    latency: '94 ms',
    reliability: 'High (Physically Constrained)',
    isOurs: true
  }
];

export const SCENARIO_BENCHMARKS = [
  {
    id: 'overall',
    title: 'Overall Test Split',
    description: '1,420 randomized 256×256 GOES-16 ABI Ch.13 IR patches across 12 calendar months',
    linearPsnr: '26.42 dB',
    farnebackPsnr: '29.85 dB',
    raftPsnr: '32.18 dB',
    astraPsnr: '36.45 dB',
    astraSsim: '0.957',
    sriPassRate: '92.6%'
  },
  {
    id: 'cyclones',
    title: 'Tropical Cyclones & Vortices',
    description: 'Rapid rotational advection, spiral rainbands and central eyewall dynamics',
    linearPsnr: '24.15 dB',
    farnebackPsnr: '28.30 dB',
    raftPsnr: '31.42 dB',
    astraPsnr: '35.80 dB',
    astraSsim: '0.948',
    sriPassRate: '89.4%'
  },
  {
    id: 'convective',
    title: 'Convective Initiation & Updrafts',
    description: 'Sudden cold-cloud-top emergence and non-conservative advection breaking pure motion flow',
    linearPsnr: '22.80 dB',
    farnebackPsnr: '26.90 dB',
    raftPsnr: '29.75 dB',
    astraPsnr: '34.62 dB',
    astraSsim: '0.939',
    sriPassRate: '86.8%'
  },
  {
    id: 'frontal',
    title: 'Frontal Boundary Cloud Bands',
    description: 'Synoptic-scale jet streaks and laminar stratiform cloud boundaries with steady displacement',
    linearPsnr: '28.20 dB',
    farnebackPsnr: '32.10 dB',
    raftPsnr: '34.50 dB',
    astraPsnr: '38.20 dB',
    astraSsim: '0.971',
    sriPassRate: '96.2%'
  }
];

export const TEAM_MEMBERS = [
  {
    name: 'Ayush Jadhav',
    phone: '+91 98231 45678',
    email: 'ayush.jadhav22@vit.edu'
  },
  {
    name: 'Soham S Jadhav',
    phone: '+91 98342 56789',
    email: 'soham.jadhav22@vit.edu'
  },
  {
    name: 'Vedant Jaiswal',
    phone: '+91 97654 32109',
    email: 'vedant.jaiswal22@vit.edu'
  },
  {
    name: 'Ayush Jha',
    phone: '+91 99220 12345',
    email: 'ayush.jha22@vit.edu'
  }
];

export const STAGES = [
  ['01', 'Calibrate', 'Counts → radiance → brightness temperature. Normalize 256 × 256 patches.'],
  ['02', 'Estimate motion', 'Bidirectional flow with Farneback or RAFT-Small.'],
  ['03', 'Warp both frames', 'Advect the observed fields toward the requested time.'],
  ['04', 'Refine residuals', 'Residual U-Net learns what motion compensation misses.'],
  ['05', 'Score reliability', 'Confidence map and a Scientific Reliability Index.'],
  ['06', 'Export', 'Intermediate field and diagnostics in NetCDF.']
];
