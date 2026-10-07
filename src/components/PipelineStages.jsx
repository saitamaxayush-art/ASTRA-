import React, { useEffect, useRef, useState } from 'react';

export const PIPELINE_STAGES_DATA = [
  {
    step: '01',
    id: 'stage-calibrate',
    badge: 'STAGE 01 · INGESTION & CALIBRATION',
    title: 'Sensor Ingestion & Radiometric Calibration',
    subtitle: 'Raw L1b Digital Numbers (DN) → Calibrated Kelvin Brightness Temperature',
    summary: 'Ingest raw satellite detector telemetry, apply non-linear Planck function calibration, and crop normalized atmospheric observation tiles.',
    whatToDo: {
      objective: 'Convert uncalibrated satellite instrument counts into physically meaningful thermodynamic Brightness Temperature (Kelvin) fields.',
      steps: [
        'Read GOES-16 ABI Band 13 (10.3 μm Clean IR Window) L1b NetCDF4 data array at consecutive observation timestamps t₀ and t₁.',
        'Apply instrument calibration coefficients: Convert 14-bit integer counts (DN) to spectral radiance L = gain · DN + offset.',
        'Invert the Planck radiation equation using ABI central wavenumber coefficients (c₁, c₂, ν) to compute Brightness Temperature (K).',
        'Extract 256×256 bounding patches centered on convective storm complexes and normalize temperatures to [0, 1] range (190 K – 310 K).'
      ],
      inputData: 'Raw GOES-16 ABI NetCDF4 Digital Counts (DN ∈ [0, 16383])',
      outputData: 'Normalized Brightness Temperature Matrices [256, 256] at t₀ and t₁',
      algorithm: 'Planck Inversion & Geospatial Fixed-Grid Navigation'
    },
    visualType: 'calibration'
  },
  {
    step: '02',
    id: 'stage-motion',
    badge: 'STAGE 02 · MOTION ESTIMATION',
    title: 'Bidirectional Optical Flow Estimation',
    subtitle: 'Recurrent RAFT-Small Architecture · All-Pairs Correlation Pyramids',
    summary: 'Estimate dense 2D velocity displacement vector fields in both forward (t₀ → t₁) and backward (t₁ → t₀) directions across cloud layers.',
    whatToDo: {
      objective: 'Capture non-rigid advection, cyclonic circulation, and atmospheric shear between observation frames without losing sub-pixel boundary detail.',
      steps: [
        'Extract multi-scale convolutional feature maps and context features from normalized boundary frames I₀ and I₁.',
        'Construct 4-level all-pairs correlation pyramids calculating 4D dot-product cost volumes between all pixel feature vectors.',
        'Run 12 iterations of the Recurrent Gated Recurrent Unit (GRU) motion encoder to predict residual flow updates Δf.',
        'Output dense forward flow field F₀→₁ and backward flow field F₁→₀ with sub-pixel motion precision (down to 0.1 px).'
      ],
      inputData: 'Calibrated input frames I₀ and I₁ [256, 256, 1]',
      outputData: 'Dense 2D Vector Fields F₀→₁ and F₁→₀ [256, 256, 2] (u, v vectors)',
      algorithm: 'RAFT-Small (Recurrent All-Pairs Field Transforms) / Farneback Flow'
    },
    visualType: 'motion'
  },
  {
    step: '03',
    id: 'stage-warp',
    badge: 'STAGE 03 · TEMPORAL WARPING',
    title: 'Time-Conditioned Bidirectional Warping',
    subtitle: 'Temporal Grid Sampling · Sub-pixel Bilinear Spatial Transformation',
    summary: 'Scale optical flow vectors linearly to the requested query time t* and warp both boundary frames forward and backward to align cloud geometries.',
    whatToDo: {
      objective: 'Form the initial physically grounded motion-compensated atmospheric state by advecting both observed frames toward the query instant t*.',
      steps: [
        'Given target query timestamp t* ∈ (0, 1), compute forward time scalar t* and backward time scalar (1 − t*).',
        'Scale displacement vectors: F_{t*→0} = −t* · F₀→₁ and F_{t*→1} = −(1 − t*) · F₁→₀.',
        'Apply differentiable bilinear backward grid sampling to advect frame I₀ forward: I_{warp, 0} = Warp(I₀, F_{t*→0}).',
        'Advect frame I₁ backward: I_{warp, 1} = Warp(I₁, F_{t*→1}), then compute time-weighted base fusion to eliminate motion ghosting.'
      ],
      inputData: 'Boundary frames I₀, I₁ and optical flow fields F₀→₁, F₁→₀ + query time t*',
      outputData: 'Motion-compensated base intermediate frame Ĩ(t*) and warped dual-frame stack',
      algorithm: 'Bilinear Grid Sampling & Temporal Motion Compensation'
    },
    visualType: 'warping'
  },
  {
    step: '04',
    id: 'stage-residual',
    badge: 'STAGE 04 · DEEP RESIDUAL SYNTHESIS',
    title: 'Convective Residual Refinement (U-Net)',
    subtitle: 'Learning Non-Conservative Updrafts, Rapid Cloud Growth & Anvil Shearing',
    summary: 'Pass motion-compensated estimates and temporal cues into a lightweight Residual U-Net to synthesize non-linear cloud growth and thermal cooling.',
    whatToDo: {
      objective: 'Correct for thermodynamic cloud growth, convective initiation, and precipitation downdrafts that pure kinematic motion vectors cannot predict.',
      steps: [
        'Concatenate boundary frames [I₀, I₁], warped fields [I_{warp, 0}, I_{warp, 1}], flow magnitude maps, and query timestamp t*.',
        'Pass 9-channel composite tensor into a 4-level Residual U-Net encoder with residual bottleneck and skip connections.',
        'Predict high-frequency temperature residual field ΔI(t*) representing localized cloud cooling (convective updrafts) and warming.',
        'Add learned residual to warped base estimate: Î(t*) = Ĩ(t*) + ΔI(t*), optimized under combined L1 pixel and Multi-scale SSIM losses.'
      ],
      inputData: 'Warped intermediate base field + boundary difference tensor [256, 256, 9]',
      outputData: 'Refined intermediate atmospheric state Î(t*) with synthesized cloud growth',
      algorithm: 'Residual U-Net · L1 Loss + MS-SSIM + Spatial Gradient Regularization'
    },
    visualType: 'residual'
  },
  {
    step: '05',
    id: 'stage-reliability',
    badge: 'STAGE 05 · SCIENTIFIC RELIABILITY INDEX',
    title: 'Physical Reliability & Uncertainty Gating (SRI)',
    subtitle: 'Bidirectional Photometric Consistency · Flow Divergence & Gradient Checks',
    summary: 'Evaluate physical plausibility across every pixel to generate a spatial confidence mask and an overall Scientific Reliability Index (0–100%).',
    whatToDo: {
      objective: 'Provide numerical weather forecasters with explicit uncertainty bounds and quality flags to determine if the frame is safe for assimilation.',
      steps: [
        'Compute bidirectional photometric consistency error map: ε_{photo} = |I_{warp, 0} − I_{warp, 1}|.',
        'Calculate flow divergence ∇·F and vortex curl |∇×F| to penalize unphysical mass destruction or excessive shear.',
        'Evaluate thermal lapse rate gradient preservation relative to observed boundaries.',
        'Synthesize metrics into pixel-level confidence C(x,y) ∈ [0, 1] and aggregate global Scientific Reliability Index (SRI = 92.6% for test split).'
      ],
      inputData: 'Refined frame Î(t*), boundary frames I₀, I₁, and flow vectors',
      outputData: 'Spatial Uncertainty Heatmap [256, 256] + Global SRI Reliability Score (92.6%)',
      algorithm: 'Multi-Factor Photometric Consistency & Flow Divergence Verification'
    },
    visualType: 'reliability'
  },
  {
    step: '06',
    id: 'stage-export',
    badge: 'STAGE 06 · OPERATIONAL EXPORT',
    title: 'CF-Compliant NetCDF4 & NWP Integration',
    subtitle: 'High-Resolution 2 km Geostationary Grid · Seamless Assimilation',
    summary: 'Package reconstructed intermediate states, uncertainty layers, and spatial coordinates into operational NetCDF4 files ready for forecast models.',
    whatToDo: {
      objective: 'Produce standardized scientific data files compatible with NOAA, HRRR, GFS, and nowcasting assimilation pipelines.',
      steps: [
        'Encode intermediate Brightness Temperature matrix into 32-bit floating point NetCDF4 data variable `brightness_temperature`.',
        'Attach geospatial coordinates (GOES-East fixed grid projection, lat/lon bounding box, and UTC timestamp t*).',
        'Embed spatial confidence layer `sri_confidence_index` and quality flags for automated assimilation filters.',
        'Write Climate and Forecast (CF-1.8) metadata attributes and export as standalone `.nc` dataset for downstream ingestion.'
      ],
      inputData: 'Synthesized intermediate array Î(t*), confidence array C(t*), and geospatial CRS',
      outputData: 'Standardized NetCDF4 scientific dataset `ASTRA_ABI_L2_RECON_t*.nc`',
      algorithm: 'NetCDF4 / HDF5 CF-1.8 Metadata Packaging & Forecast Dispatch'
    },
    visualType: 'export'
  }
];

export default function PipelineStages() {
  const [activeStage, setActiveStage] = useState(0);
  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-stage-index'));
            if (!isNaN(index)) {
              setActiveStage(index);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -40% 0px',
        threshold: 0.2
      }
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToStage = (index) => {
    const el = cardRefs.current[index];
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="pipeline-flow-wrapper">
      {/* Sticky Stage Navigation Tracker */}
      <div className="pipeline-sticky-tracker">
        <div className="tracker-inner">
          <div className="tracker-label">
            <span className="live-dot" />
            <span>PIPELINE STAGE: <b>0{activeStage + 1} / 06</b></span>
          </div>
          <div className="tracker-pills">
            {PIPELINE_STAGES_DATA.map((st, i) => (
              <button
                key={st.step}
                type="button"
                className={`tracker-pill ${activeStage === i ? 'active' : ''} ${i < activeStage ? 'passed' : ''}`}
                onClick={() => scrollToStage(i)}
                title={`Jump to Stage ${st.step}: ${st.title}`}
              >
                <span className="pill-num">{st.step}</span>
                <span className="pill-name">{st.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>
          <div className="tracker-progress-bar">
            <div
              className="tracker-progress-fill"
              style={{ width: `${((activeStage + 1) / PIPELINE_STAGES_DATA.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cards Stream */}
      <div className="pipeline-cards-stream">
        {PIPELINE_STAGES_DATA.map((stage, idx) => (
          <article
            key={stage.id}
            id={stage.id}
            data-stage-index={idx}
            ref={(el) => (cardRefs.current[idx] = el)}
            className={`pipeline-stage-card ${activeStage === idx ? 'is-active-stage' : ''}`}
          >
            {/* Stage Card Header */}
            <div className="stage-card-meta">
              <div className="stage-card-badge-row">
                <span className="stage-chip-primary">{stage.badge}</span>
                <span className="stage-status-indicator">
                  {idx === activeStage ? '● ACTIVE STAGE' : idx < activeStage ? '✓ COMPLETED' : '○ PENDING'}
                </span>
              </div>
              <h3 className="stage-main-title">{stage.title}</h3>
              <p className="stage-subtitle-line">{stage.subtitle}</p>
              <p className="stage-summary-text">{stage.summary}</p>
            </div>

            {/* Split Grid: Left = What to do in this step, Right = Picture of the solution */}
            <div className="stage-card-split">
              {/* Left Column: Action Guide */}
              <div className="stage-action-panel">
                <div className="action-panel-header">
                  <span className="action-icon">📋</span>
                  <h4>WHAT YOU HAVE TO DO IN THIS STEP</h4>
                </div>

                <div className="action-objective-box">
                  <strong>STEP OBJECTIVE:</strong>
                  <p>{stage.whatToDo.objective}</p>
                </div>

                <div className="action-steps-list">
                  <strong>EXECUTION WORKFLOW:</strong>
                  <ol>
                    {stage.whatToDo.steps.map((s, stepIdx) => (
                      <li key={stepIdx}>
                        <span className="step-number-tag">{stepIdx + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="action-io-spec">
                  <div className="io-row">
                    <span className="io-tag io-in">INPUT</span>
                    <code>{stage.whatToDo.inputData}</code>
                  </div>
                  <div className="io-row">
                    <span className="io-tag io-out">OUTPUT</span>
                    <code>{stage.whatToDo.outputData}</code>
                  </div>
                  <div className="io-row">
                    <span className="io-tag io-tech">ALGORITHM</span>
                    <span>{stage.whatToDo.algorithm}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: High-fidelity Solution Picture */}
              <div className="stage-solution-visual-panel">
                <div className="visual-panel-top">
                  <div className="solution-pic-badge">
                    <span className="dot-pulse" />
                    <span>PICTURE OF THE SOLUTION · STAGE {stage.step}</span>
                  </div>
                  <span className="visual-scale-tag">SIMULATED SATELLITE ENGINE</span>
                </div>

                <div className="solution-graphic-container">
                  {stage.visualType === 'calibration' && <CalibrationSolutionPicture />}
                  {stage.visualType === 'motion' && <MotionSolutionPicture />}
                  {stage.visualType === 'warping' && <WarpingSolutionPicture />}
                  {stage.visualType === 'residual' && <ResidualSolutionPicture />}
                  {stage.visualType === 'reliability' && <ReliabilitySolutionPicture />}
                  {stage.visualType === 'export' && <ExportSolutionPicture />}
                </div>

                <div className="visual-panel-footer">
                  <span className="legend-label">Scientific Output:</span>
                  <span className="legend-desc">
                    {stage.visualType === 'calibration' && 'Raw 14-bit integer DN matrix inverted to 10.3 μm thermodynamic Kelvin field (190K–310K)'}
                    {stage.visualType === 'motion' && 'Sub-pixel optical flow displacement vectors [u, v] capturing vortex circulation and jet shearing'}
                    {stage.visualType === 'warping' && 'Bilinear spatial grid advection converging boundaries toward requested intermediate instant t*'}
                    {stage.visualType === 'residual' && 'Residual U-Net synthesizing convective updrafts and cloud anvil growth that motion advection missed'}
                    {stage.visualType === 'reliability' && 'Multi-factor Scientific Reliability Index (SRI = 92.6%) with spatial uncertainty classification'}
                    {stage.visualType === 'export' && 'CF-1.8 compliant NetCDF4 multi-dimensional array ready for operational weather model ingestion'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Card Bottom Action Bar */}
            <div className="stage-card-bottom-bar">
              <div className="stage-progress-hint">
                Stage {stage.step} of 06 · Scroll to reveal next stage
              </div>
              <div className="stage-nav-buttons">
                {idx > 0 && (
                  <button
                    type="button"
                    className="stage-btn-prev"
                    onClick={() => scrollToStage(idx - 1)}
                  >
                    ← Previous Stage
                  </button>
                )}
                {idx < PIPELINE_STAGES_DATA.length - 1 && (
                  <button
                    type="button"
                    className="stage-btn-next"
                    onClick={() => scrollToStage(idx + 1)}
                  >
                    Next Stage (0{idx + 2}) →
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   HIGH-FIDELITY SOLUTION PICTURES FOR EACH STAGE
   ========================================================================= */

// STAGE 01: Calibration Solution Picture
function CalibrationSolutionPicture() {
  return (
    <div className="solution-pic solution-pic-calibration">
      <svg viewBox="0 0 540 330" className="solution-svg" aria-label="Radiometric Calibration Solution Diagram">
        <defs>
          <linearGradient id="irThermalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1035" />
            <stop offset="25%" stopColor="#4a154b" />
            <stop offset="50%" stopColor="#0057ff" />
            <stop offset="75%" stopColor="#00d4ff" />
            <stop offset="90%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="kelvinRamp" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#00d4ff" />
            <stop offset="45%" stopColor="#0057ff" />
            <stop offset="70%" stopColor="#4a154b" />
            <stop offset="100%" stopColor="#1e1035" />
          </linearGradient>
        </defs>

        {/* Background Grid */}
        <rect width="540" height="330" fill="#0B1320" rx="8" />
        <path d="M 0 55 L 540 55 M 0 110 L 540 110 M 0 165 L 540 165 M 0 220 L 540 220 M 0 275 L 540 275" stroke="#16233B" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M 90 0 L 90 330 M 180 0 L 180 330 M 270 0 L 270 330 M 360 0 L 360 330 M 450 0 L 450 330" stroke="#16233B" strokeWidth="1" strokeDasharray="3 3" />

        {/* Left: Raw Digital Numbers Panel */}
        <g transform="translate(18, 20)">
          <rect width="180" height="225" rx="6" fill="#111B2C" stroke="#253550" strokeWidth="1.2" />
          <text x="12" y="24" fill="#6B7C96" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="600">RAW L1b TELEMETRY</text>
          <text x="12" y="38" fill="#9BAEC8" fontSize="11" fontWeight="700">Digital Counts (DN)</text>

          {/* Matrix Cells */}
          <g transform="translate(12, 50)">
            {[
              ['0x3B8', '0x4F1', '0x8A2'],
              ['0x2A1', '0x1F0', '0x7C9'],
              ['0x1E4', '0x140', '0x62B']
            ].map((row, r) => (
              <g key={r} transform={`translate(0, ${r * 38})`}>
                {row.map((val, c) => (
                  <g key={c} transform={`translate(${c * 52}, 0)`}>
                    <rect width="48" height="32" rx="3" fill="#18263E" stroke="#2B3E60" strokeWidth="1" />
                    <text x="24" y="20" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" textAnchor="middle">{val}</text>
                  </g>
                ))}
              </g>
            ))}
          </g>
          <text x="12" y="185" fill="#586A85" fontSize="9" fontFamily="DM Mono, monospace">Sensor: GOES-16 ABI Ch.13</text>
          <text x="12" y="202" fill="#586A85" fontSize="9" fontFamily="DM Mono, monospace">Resolution: 2 km · 14-bit</text>
        </g>

        {/* Center: Radiometric Transfer Function Arrow */}
        <g transform="translate(208, 105)">
          <circle cx="28" cy="28" r="24" fill="#0057FF" opacity="0.15" />
          <circle cx="28" cy="28" r="20" fill="#132238" stroke="#0057FF" strokeWidth="1.5" />
          <path d="M 22 28 L 34 28 M 30 22 L 36 28 L 30 34" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x="28" y="68" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle" fontWeight="700">PLANCK INVERSION</text>
          <text x="28" y="80" fill="#7E93B0" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">Tb = c₂ν / ln(1+c₁ν³/L)</text>
        </g>

        {/* Right: Calibrated Kelvin Brightness Temp View */}
        <g transform="translate(272, 20)">
          <rect width="250" height="225" rx="6" fill="#111B2C" stroke="#0057FF" strokeWidth="1.5" />
          <text x="14" y="24" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">CALIBRATED FIELD: Tb (K)</text>
          <text x="14" y="38" fill="#E2E8F0" fontSize="11" fontWeight="700">Thermodynamic Clean IR</text>

          {/* Calibrated False-Color Satellite Cloud Simulation */}
          <g transform="translate(14, 48)">
            <rect width="222" height="120" rx="4" fill="url(#irThermalGradient)" />
            {/* Atmospheric contours */}
            <path d="M 20 40 Q 60 10 110 50 T 200 40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 10 90 Q 70 70 140 100 T 210 80" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
            <circle cx="110" cy="55" r="32" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
            <circle cx="110" cy="55" r="14" fill="#FFFFFF" opacity="0.9" />
            <text x="110" y="59" fill="#111B2C" fontSize="9" fontWeight="800" textAnchor="middle">198 K</text>
            <text x="110" y="100" fill="#FFFFFF" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle" fontWeight="600">Deep Convective Updraft</text>
          </g>

          {/* Coordinate Stamp */}
          <text x="14" y="186" fill="#7E93B0" fontSize="9" fontFamily="DM Mono, monospace">Tile Grid: [256 × 256] @ 10.3 μm</text>
          <text x="14" y="202" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace">Temp Range: 190.2 K – 308.6 K</text>
        </g>

        {/* Bottom Temperature Legend Ramp */}
        <g transform="translate(35, 262)">
          <rect width="470" height="12" rx="3" fill="url(#kelvinRamp)" stroke="#253550" strokeWidth="1" />
          <text x="0" y="28" fill="#FFFFFF" fontSize="10" fontFamily="DM Mono, monospace">190 K (Cold Convective Tops)</text>
          <text x="235" y="28" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" textAnchor="middle">245 K (Cirrus/Mid)</text>
          <text x="470" y="28" fill="#A0AEC0" fontSize="10" fontFamily="DM Mono, monospace" textAnchor="end">310 K (Warm Surface)</text>
        </g>
      </svg>
    </div>
  );
}

// STAGE 02: Motion Estimation Solution Picture
function MotionSolutionPicture() {
  return (
    <div className="solution-pic solution-pic-motion">
      <svg viewBox="0 0 540 330" className="solution-svg" aria-label="Optical Flow Motion Estimation Diagram">
        <defs>
          <linearGradient id="cycloneBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B1528" />
            <stop offset="50%" stopColor="#142646" />
            <stop offset="100%" stopColor="#0B1528" />
          </linearGradient>
          <marker id="flowArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#00D4FF" />
          </marker>
          <marker id="flowArrowFast" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#F59E0B" />
          </marker>
        </defs>

        <rect width="540" height="330" fill="url(#cycloneBg)" rx="8" />
        <path d="M 0 55 L 540 55 M 0 110 L 540 110 M 0 165 L 540 165 M 0 220 L 540 220" stroke="#1C2E4E" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M 135 0 L 135 330 M 270 0 L 270 330 M 405 0 L 405 330" stroke="#1C2E4E" strokeWidth="1" strokeDasharray="3 3" />

        {/* Central Cyclone Cloud Mass */}
        <g transform="translate(190, 130)">
          <circle cx="0" cy="0" r="85" fill="#1A335B" opacity="0.6" />
          <circle cx="0" cy="0" r="50" fill="#244477" opacity="0.8" />
          <circle cx="0" cy="0" r="16" fill="#0E1B31" stroke="#00D4FF" strokeWidth="1.5" />
          <text x="0" y="4" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle" fontWeight="700">EYE</text>

          {/* Spiral cloud bands */}
          <path d="M 16 0 A 30 30 0 0 1 0 45 A 55 55 0 0 1 -70 10" fill="none" stroke="#3B67A8" strokeWidth="14" strokeLinecap="round" opacity="0.5" />
          <path d="M -16 0 A 30 30 0 0 1 0 -45 A 55 55 0 0 1 70 -10" fill="none" stroke="#3B67A8" strokeWidth="14" strokeLinecap="round" opacity="0.5" />

          {/* Dense Optical Flow Quiver Vectors */}
          {/* Outer ring */}
          <path d="M 0 -70 L 35 -65" stroke="#00D4FF" strokeWidth="2" markerEnd="url(#flowArrow)" />
          <path d="M 55 -45 L 75 -15" stroke="#00D4FF" strokeWidth="2" markerEnd="url(#flowArrow)" />
          <path d="M 70 0 L 65 35" stroke="#F59E0B" strokeWidth="2.4" markerEnd="url(#flowArrowFast)" />
          <path d="M 50 50 L 20 70" stroke="#F59E0B" strokeWidth="2.4" markerEnd="url(#flowArrowFast)" />
          <path d="M 0 70 L -35 65" stroke="#00D4FF" strokeWidth="2" markerEnd="url(#flowArrow)" />
          <path d="M -55 45 L -75 15" stroke="#00D4FF" strokeWidth="2" markerEnd="url(#flowArrow)" />
          <path d="M -70 0 L -65 -35" stroke="#00D4FF" strokeWidth="2" markerEnd="url(#flowArrow)" />
          <path d="M -50 -50 L -20 -70" stroke="#00D4FF" strokeWidth="2" markerEnd="url(#flowArrow)" />

          {/* Inner intense vortex ring */}
          <path d="M 0 -35 L 25 -25" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#flowArrowFast)" />
          <path d="M 30 -5 L 25 25" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#flowArrowFast)" />
          <path d="M 0 35 L -25 25" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#flowArrowFast)" />
          <path d="M -30 5 L -25 -25" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#flowArrowFast)" />
        </g>

        {/* Left Stats Overlay */}
        <g transform="translate(20, 24)">
          <rect width="140" height="95" rx="5" fill="#0C1729" stroke="#1E3355" strokeWidth="1.2" />
          <text x="12" y="22" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">DENSE FLOW FIELD</text>
          <text x="12" y="42" fill="#FFFFFF" fontSize="13" fontWeight="700">F₀→₁ (u, v)</text>
          <text x="12" y="60" fill="#7E93B0" fontSize="9" fontFamily="DM Mono, monospace">Mean Speed: 42.8 km/h</text>
          <text x="12" y="74" fill="#7E93B0" fontSize="9" fontFamily="DM Mono, monospace">Max Vorticity: 118 km/h</text>
          <text x="12" y="88" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace">Precision: Sub-pixel (0.1px)</text>
        </g>

        {/* Right Model Architecture Callout */}
        <g transform="translate(370, 24)">
          <rect width="150" height="140" rx="5" fill="#0C1729" stroke="#0057FF" strokeWidth="1.2" />
          <text x="12" y="22" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">RAFT-SMALL PIPELINE</text>
          <rect x="12" y="32" width="126" height="20" rx="3" fill="#152642" />
          <text x="18" y="46" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace">1. Feature Enc (1/8)</text>
          <rect x="12" y="56" width="126" height="20" rx="3" fill="#152642" />
          <text x="18" y="70" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace">2. 4D Correlation Pyramids</text>
          <rect x="12" y="80" width="126" height="20" rx="3" fill="#152642" />
          <text x="18" y="94" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace">3. 12× GRU Flow Iterations</text>
          <rect x="12" y="104" width="126" height="20" rx="3" fill="#0057FF" />
          <text x="18" y="118" fill="#FFFFFF" fontSize="9" fontFamily="DM Mono, monospace" fontWeight="700">4. Dense Flow Output</text>
        </g>

        {/* Bottom Legend */}
        <g transform="translate(20, 280)">
          <rect width="500" height="32" rx="4" fill="#0C1729" stroke="#1E3355" strokeWidth="1" />
          <circle cx="24" cy="16" r="5" fill="#00D4FF" />
          <text x="36" y="20" fill="#CBD5E1" fontSize="10" fontFamily="DM Mono, monospace">Laminar Flow (0–50 km/h)</text>

          <circle cx="210" cy="16" r="5" fill="#F59E0B" />
          <text x="222" y="20" fill="#CBD5E1" fontSize="10" fontFamily="DM Mono, monospace">Severe Shear / Jet (50–140 km/h)</text>

          <text x="480" y="20" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" textAnchor="end">Bidirectional: F₀→₁ &amp; F₁→₀</text>
        </g>
      </svg>
    </div>
  );
}

// STAGE 03: Warping Solution Picture
function WarpingSolutionPicture() {
  return (
    <div className="solution-pic solution-pic-warping">
      <svg viewBox="0 0 540 330" className="solution-svg" aria-label="Bidirectional Warping Convergence Diagram">
        <defs>
          <linearGradient id="cloudA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#253E68" />
            <stop offset="100%" stopColor="#0F1B2F" />
          </linearGradient>
          <linearGradient id="cloudB" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E4D8C" />
            <stop offset="100%" stopColor="#0B1E38" />
          </linearGradient>
          <linearGradient id="cloudTarget" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0057FF" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
        </defs>

        <rect width="540" height="330" fill="#09111D" rx="8" />
        <path d="M 0 55 L 540 55 M 0 110 L 540 110 M 0 165 L 540 165 M 0 220 L 540 220" stroke="#142135" strokeWidth="1" strokeDasharray="3 3" />

        {/* Frame A: t0 */}
        <g transform="translate(25, 50)">
          <rect width="130" height="150" rx="5" fill="url(#cloudA)" stroke="#2B4673" strokeWidth="1.2" />
          <text x="12" y="24" fill="#94A3B8" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">OBSERVED FRAME</text>
          <text x="12" y="42" fill="#FFFFFF" fontSize="15" fontWeight="700">t₀ (00:00 UTC)</text>
          {/* Cloud representation */}
          <ellipse cx="65" cy="90" rx="40" ry="28" fill="#3B67A8" opacity="0.7" />
          <circle cx="50" cy="85" r="18" fill="#60A5FA" opacity="0.9" />
          <text x="65" y="138" fill="#94A3B8" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">Initial Position X₀</text>
        </g>

        {/* Warp Forward Arrow */}
        <g transform="translate(162, 105)">
          <path d="M 0 20 L 38 20" stroke="#00D4FF" strokeWidth="2.5" strokeDasharray="4 2" />
          <path d="M 32 14 L 40 20 L 32 26" stroke="#00D4FF" strokeWidth="2.5" fill="none" />
          <text x="20" y="8" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">+t* · F₀→₁</text>
          <text x="20" y="38" fill="#64748B" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">Forward Warp</text>
        </g>

        {/* Center: Reconstructed Target Frame t* */}
        <g transform="translate(208, 30)">
          <rect width="144" height="190" rx="6" fill="#0E1A2C" stroke="#0057FF" strokeWidth="2" />
          <rect x="0" y="0" width="144" height="28" rx="5" fill="#0057FF" />
          <text x="72" y="18" fill="#FFFFFF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="800" textAnchor="middle">ESTIMATED BASE Î(t*)</text>
          <text x="72" y="48" fill="#00D4FF" fontSize="13" fontWeight="800" textAnchor="middle">t* (00:07:30 UTC)</text>

          {/* Advected converged cloud */}
          <g transform="translate(72, 110)">
            {/* Grid warp mesh lines */}
            <path d="M -45 -30 L 45 -20 M -48 0 L 48 5 M -45 30 L 45 25" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
            <path d="M -30 -40 L -25 40 M 0 -45 L 5 45 M 30 -40 L 35 40" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
            <ellipse cx="4" cy="0" rx="44" ry="30" fill="url(#cloudTarget)" opacity="0.8" />
            <circle cx="8" cy="-4" r="19" fill="#FFFFFF" opacity="0.95" />
            <text x="8" y="0" fill="#0057FF" fontSize="8" fontWeight="800" textAnchor="middle">CONVERGED</text>
          </g>

          <text x="72" y="174" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle" fontWeight="700">Bilinear Grid Advection</text>
        </g>

        {/* Warp Backward Arrow */}
        <g transform="translate(358, 105)">
          <path d="M 40 20 L 2 20" stroke="#00D4FF" strokeWidth="2.5" strokeDasharray="4 2" />
          <path d="M 8 14 L 0 20 L 8 26" stroke="#00D4FF" strokeWidth="2.5" fill="none" />
          <text x="20" y="8" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">-(1-t*) · F₁→₀</text>
          <text x="20" y="38" fill="#64748B" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">Backward Warp</text>
        </g>

        {/* Frame B: t1 */}
        <g transform="translate(405, 50)">
          <rect width="115" height="150" rx="5" fill="url(#cloudB)" stroke="#2B4673" strokeWidth="1.2" />
          <text x="10" y="24" fill="#94A3B8" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">OBSERVED FRAME</text>
          <text x="10" y="42" fill="#FFFFFF" fontSize="15" fontWeight="700">t₁ (00:15 UTC)</text>
          {/* Cloud representation shifted */}
          <ellipse cx="68" cy="90" rx="42" ry="28" fill="#3B67A8" opacity="0.7" />
          <circle cx="78" cy="85" r="18" fill="#60A5FA" opacity="0.9" />
          <text x="58" y="138" fill="#94A3B8" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">Final Position X₁</text>
        </g>

        {/* Bottom Explanation Banner */}
        <g transform="translate(25, 235)">
          <rect width="495" height="75" rx="5" fill="#0C1626" stroke="#1D304D" strokeWidth="1" />
          <text x="16" y="24" fill="#00D4FF" fontSize="11" fontFamily="DM Mono, monospace" fontWeight="700">HOW THIS ELIMINATES ARTIFACTS:</text>
          <text x="16" y="44" fill="#CBD5E1" fontSize="10">Linear interpolation simply blends pixel opacities, producing ghosting and blurred double-edges.</text>
          <text x="16" y="60" fill="#94A3B8" fontSize="10">ASTRA deforms pixels along the continuous physical path, preserving sharp cloud boundaries and vortex curls.</text>
        </g>
      </svg>
    </div>
  );
}

// STAGE 04: Residual U-Net Solution Picture
function ResidualSolutionPicture() {
  return (
    <div className="solution-pic solution-pic-residual">
      <svg viewBox="0 0 540 330" className="solution-svg" aria-label="Deep Residual U-Net Refinement Diagram">
        <defs>
          <linearGradient id="residualDelta" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        <rect width="540" height="330" fill="#0A1220" rx="8" />

        {/* U-Net Schematic on Top */}
        <g transform="translate(20, 20)">
          <rect width="500" height="150" rx="6" fill="#0F1B2F" stroke="#1E3355" strokeWidth="1.2" />
          <text x="16" y="24" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">RESIDUAL U-NET ARCHITECTURE (REFINEMENT STAGE)</text>

          {/* Encoder Blocks */}
          <rect x="25" y="40" width="45" height="85" rx="3" fill="#182E50" stroke="#0057FF" strokeWidth="1" />
          <text x="47" y="85" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">ENC 1</text>

          <rect x="85" y="55" width="40" height="70" rx="3" fill="#182E50" stroke="#0057FF" strokeWidth="1" />
          <text x="105" y="93" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">ENC 2</text>

          <rect x="140" y="70" width="35" height="55" rx="3" fill="#182E50" stroke="#0057FF" strokeWidth="1" />
          <text x="157" y="100" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">ENC 3</text>

          {/* Bottleneck with Attention */}
          <rect x="190" y="85" width="50" height="40" rx="3" fill="#0057FF" stroke="#00D4FF" strokeWidth="1.5" />
          <text x="215" y="108" fill="#FFFFFF" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle" fontWeight="700">BOTTLENECK</text>

          {/* Skip Connections */}
          <path d="M 70 50 L 350 50" stroke="#00D4FF" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <path d="M 125 65 L 295 65" stroke="#00D4FF" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <path d="M 175 80 L 245 80" stroke="#00D4FF" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <text x="250" y="45" fill="#00D4FF" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">Long Skip Connections (Preserves Sharp Edges)</text>

          {/* Decoder Blocks */}
          <rect x="255" y="70" width="35" height="55" rx="3" fill="#1D3962" stroke="#00D4FF" strokeWidth="1" />
          <text x="272" y="100" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">DEC 3</text>

          <rect x="305" y="55" width="40" height="70" rx="3" fill="#1D3962" stroke="#00D4FF" strokeWidth="1" />
          <text x="325" y="93" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">DEC 2</text>

          <rect x="360" y="40" width="45" height="85" rx="3" fill="#1D3962" stroke="#00D4FF" strokeWidth="1" />
          <text x="382" y="85" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle">DEC 1</text>

          {/* Output Arrow to Residual Delta */}
          <path d="M 412 82 L 442 82" stroke="#F59E0B" strokeWidth="2.5" />
          <path d="M 436 76 L 444 82 L 436 88" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
          <text x="470" y="78" fill="#F59E0B" fontSize="11" fontFamily="DM Mono, monospace" fontWeight="800">ΔI(t*)</text>
          <text x="470" y="92" fill="#94A3B8" fontSize="8" fontFamily="DM Mono, monospace">Residual</text>
        </g>

        {/* Bottom Split: What the Residual Adds */}
        <g transform="translate(20, 185)">
          {/* Warped Base */}
          <g transform="translate(0, 0)">
            <rect width="145" height="120" rx="5" fill="#0F1B2F" stroke="#1E3355" strokeWidth="1" />
            <text x="12" y="20" fill="#94A3B8" fontSize="9" fontFamily="DM Mono, monospace">WARPED BASE</text>
            <text x="12" y="34" fill="#FFFFFF" fontSize="11" fontWeight="700">Ĩ(t*) Pure Motion</text>
            <circle cx="72" cy="74" r="30" fill="#25426E" />
            <text x="72" y="78" fill="#94A3B8" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">Missing Updrafts</text>
          </g>

          <text x="160" y="65" fill="#00D4FF" fontSize="22" fontWeight="700">+</text>

          {/* Learned Convective Residual */}
          <g transform="translate(180, 0)">
            <rect width="145" height="120" rx="5" fill="#0F1B2F" stroke="#F59E0B" strokeWidth="1.2" />
            <text x="12" y="20" fill="#F59E0B" fontSize="9" fontFamily="DM Mono, monospace" fontWeight="700">LEARNED RESIDUAL</text>
            <text x="12" y="34" fill="#FFFFFF" fontSize="11" fontWeight="700">ΔI(t*) Convective Delta</text>
            <circle cx="72" cy="74" r="28" fill="#13243B" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="72" cy="74" r="14" fill="#F59E0B" opacity="0.8" />
            <text x="72" y="77" fill="#000000" fontSize="8" fontWeight="800" textAnchor="middle">NEW CELL</text>
            <text x="72" y="112" fill="#F59E0B" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">+4.27 dB PSNR Boost</text>
          </g>

          <text x="340" y="65" fill="#00D4FF" fontSize="22" fontWeight="700">=</text>

          {/* Final Refined Output */}
          <g transform="translate(360, 0)">
            <rect width="140" height="120" rx="5" fill="#0F1B2F" stroke="#00D4FF" strokeWidth="1.5" />
            <text x="12" y="20" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace" fontWeight="700">REFINED STATE</text>
            <text x="12" y="34" fill="#FFFFFF" fontSize="11" fontWeight="700">Î(t*) Final Output</text>
            <circle cx="70" cy="74" r="32" fill="#0057FF" opacity="0.8" />
            <circle cx="70" cy="74" r="16" fill="#FFFFFF" />
            <text x="70" y="78" fill="#0057FF" fontSize="9" fontWeight="800" textAnchor="middle">SHARP</text>
            <text x="70" y="112" fill="#00D4FF" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">SSIM: 0.957</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

// STAGE 05: Reliability Solution Picture
function ReliabilitySolutionPicture() {
  return (
    <div className="solution-pic solution-pic-reliability">
      <svg viewBox="0 0 540 330" className="solution-svg" aria-label="Scientific Reliability Index Gating Diagram">
        <defs>
          <linearGradient id="sriGauge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
        </defs>

        <rect width="540" height="330" fill="#0A1220" rx="8" />

        {/* Left: Spatial Reliability / Uncertainty Heatmap */}
        <g transform="translate(20, 20)">
          <rect width="260" height="235" rx="6" fill="#0F1B2F" stroke="#1E3355" strokeWidth="1.2" />
          <text x="14" y="24" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">SPATIAL UNCERTAINTY HEATMAP</text>
          <text x="14" y="38" fill="#94A3B8" fontSize="9" fontFamily="DM Mono, monospace">Pixel-by-pixel reliability mask C(x,y)</text>

          {/* Spatial Heatmap Simulation */}
          <g transform="translate(14, 48)">
            <rect width="232" height="140" rx="4" fill="#0B2E4F" />
            {/* High confidence zone */}
            <circle cx="116" cy="70" r="60" fill="#0057FF" opacity="0.6" />
            <ellipse cx="116" cy="70" rx="42" ry="32" fill="#10B981" opacity="0.5" />
            {/* Convective growth attention zone */}
            <circle cx="80" cy="55" r="18" fill="#F59E0B" opacity="0.75" />
            <circle cx="80" cy="55" r="8" fill="#EF4444" opacity="0.8" />
            <text x="80" y="58" fill="#FFFFFF" fontSize="8" fontWeight="800" textAnchor="middle">!</text>

            <text x="116" y="74" fill="#FFFFFF" fontSize="9" fontWeight="700" textAnchor="middle">96% Confident</text>
            <text x="116" y="87" fill="#A7F3D0" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">Laminar Flow Zone</text>
          </g>

          {/* Map legend */}
          <g transform="translate(14, 200)">
            <circle cx="6" cy="6" r="4" fill="#10B981" />
            <text x="14" y="9" fill="#CBD5E1" fontSize="8" fontFamily="DM Mono, monospace">High (&gt;90%)</text>
            <circle cx="90" cy="6" r="4" fill="#F59E0B" />
            <text x="98" y="9" fill="#CBD5E1" fontSize="8" fontFamily="DM Mono, monospace">Caution (70–90%)</text>
            <circle cx="180" cy="6" r="4" fill="#EF4444" />
            <text x="188" y="9" fill="#CBD5E1" fontSize="8" fontFamily="DM Mono, monospace">Warning (&lt;70%)</text>
          </g>
        </g>

        {/* Right: Global SRI Gauge and Pass Verification */}
        <g transform="translate(300, 20)">
          <rect width="220" height="235" rx="6" fill="#0F1B2F" stroke="#0057FF" strokeWidth="1.5" />
          <text x="14" y="24" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">SCIENTIFIC RELIABILITY (SRI)</text>

          {/* Big Score Radial Ring */}
          <g transform="translate(110, 95)">
            <circle cx="0" cy="0" r="50" fill="#0B1626" stroke="#1E3355" strokeWidth="8" />
            <circle
              cx="0"
              cy="0"
              r="50"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="8"
              strokeDasharray="314"
              strokeDashoffset="24"
              strokeLinecap="round"
              transform="rotate(-90)"
            />
            <text x="0" y="8" fill="#FFFFFF" fontSize="28" fontWeight="800" textAnchor="middle">92.6%</text>
            <text x="0" y="24" fill="#10B981" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="middle" fontWeight="700">PASS · VALID</text>
          </g>

          {/* Verification Criteria Checklist */}
          <g transform="translate(14, 160)">
            <text x="0" y="12" fill="#10B981" fontSize="10">✓</text>
            <text x="14" y="12" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace">Photometric Error &lt; 0.05</text>

            <text x="0" y="30" fill="#10B981" fontSize="10">✓</text>
            <text x="14" y="30" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace">Flow Div Conservation</text>

            <text x="0" y="48" fill="#10B981" fontSize="10">✓</text>
            <text x="14" y="48" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace">Thermal Gradient Preserved</text>
          </g>
        </g>

        {/* Bottom Banner */}
        <g transform="translate(20, 268)">
          <rect width="500" height="42" rx="4" fill="#0A182E" stroke="#1D355C" strokeWidth="1" />
          <text x="16" y="26" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">OPERATIONAL BENEFIT:</text>
          <text x="175" y="26" fill="#CBD5E1" fontSize="10">Automated gate flags low-confidence convective storms before injecting frames into numerical models.</text>
        </g>
      </svg>
    </div>
  );
}

// STAGE 06: NetCDF Export Solution Picture
function ExportSolutionPicture() {
  return (
    <div className="solution-pic solution-pic-export">
      <svg viewBox="0 0 540 330" className="solution-svg" aria-label="NetCDF4 Operational Export Solution Diagram">
        <rect width="540" height="330" fill="#0A1220" rx="8" />

        {/* Left: 3D Scientific Data Cube */}
        <g transform="translate(20, 25)">
          <rect width="250" height="275" rx="6" fill="#0E192B" stroke="#1E3355" strokeWidth="1.2" />
          <text x="14" y="24" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">NETCDF4 MULTIDIMENSIONAL CUBE</text>
          <text x="14" y="38" fill="#94A3B8" fontSize="9" fontFamily="DM Mono, monospace">Dimensions: [time: 1, lat: 256, lon: 256]</text>

          {/* Isometric Cube Layers */}
          <g transform="translate(45, 65)">
            {/* Layer 3: Residuals */}
            <polygon points="0,60 80,20 160,60 80,100" fill="#1E293B" stroke="#334155" strokeWidth="1.2" />
            <text x="80" y="65" fill="#94A3B8" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">layer 3: convective_residual (K)</text>

            {/* Layer 2: SRI Confidence */}
            <polygon points="0,35 80,-5 160,35 80,75" fill="#132F52" stroke="#0057FF" strokeWidth="1.2" />
            <text x="80" y="40" fill="#00D4FF" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">layer 2: sri_confidence [0..1]</text>

            {/* Layer 1: Brightness Temperature */}
            <polygon points="0,10 80,-30 160,10 80,50" fill="#0057FF" stroke="#00D4FF" strokeWidth="1.5" />
            <text x="80" y="15" fill="#FFFFFF" fontSize="9" fontFamily="DM Mono, monospace" fontWeight="700" textAnchor="middle">layer 1: brightness_temp (K)</text>
          </g>

          <g transform="translate(14, 215)">
            <text x="0" y="12" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace">Coordinate Ref: GOES-E Fixed Grid</text>
            <text x="0" y="26" fill="#E2E8F0" fontSize="9" fontFamily="DM Mono, monospace">Compliance: Climate &amp; Forecast (CF-1.8)</text>
            <text x="0" y="40" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace">File Size: 412 KB / 256×256 tile</text>
          </g>
        </g>

        {/* Right: Operational Header & Downstream Integration */}
        <g transform="translate(290, 25)">
          <rect width="230" height="155" rx="6" fill="#0B1526" stroke="#0057FF" strokeWidth="1.2" />
          <text x="12" y="22" fill="#00D4FF" fontSize="10" fontFamily="DM Mono, monospace" fontWeight="700">FILE METADATA HEADER (.nc)</text>

          {/* Terminal / Header View */}
          <g transform="translate(12, 34)">
            <rect width="206" height="106" rx="3" fill="#070E1A" />
            <text x="8" y="18" fill="#10B981" fontSize="8" fontFamily="DM Mono, monospace">$ ncdump -h astra_t_star.nc</text>
            <text x="8" y="32" fill="#7E93B0" fontSize="8" fontFamily="DM Mono, monospace">netcdf astra_t_star &#123;</text>
            <text x="8" y="46" fill="#94A3B8" fontSize="8" fontFamily="DM Mono, monospace">&nbsp;&nbsp;float Tb(time, y, x) ;</text>
            <text x="8" y="60" fill="#94A3B8" fontSize="8" fontFamily="DM Mono, monospace">&nbsp;&nbsp;&nbsp;&nbsp;Tb:units = "Kelvin" ;</text>
            <text x="8" y="74" fill="#94A3B8" fontSize="8" fontFamily="DM Mono, monospace">&nbsp;&nbsp;float sri(time, y, x) ;</text>
            <text x="8" y="88" fill="#00D4FF" fontSize="8" fontFamily="DM Mono, monospace">&nbsp;&nbsp;&nbsp;&nbsp;sri:score = 0.926 ;</text>
            <text x="8" y="100" fill="#7E93B0" fontSize="8" fontFamily="DM Mono, monospace">&#125;</text>
          </g>
        </g>

        {/* Downstream Forecast Assimilation Pipeline */}
        <g transform="translate(290, 195)">
          <rect width="230" height="105" rx="6" fill="#0E192B" stroke="#1E3355" strokeWidth="1" />
          <text x="12" y="20" fill="#00D4FF" fontSize="9" fontFamily="DM Mono, monospace" fontWeight="700">DOWNSTREAM ASSIMILATION</text>

          <g transform="translate(12, 32)">
            <rect x="0" y="0" width="95" height="26" rx="3" fill="#142642" stroke="#25426E" strokeWidth="1" />
            <text x="47" y="16" fill="#E2E8F0" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">HRRR Model</text>

            <rect x="110" y="0" width="95" height="26" rx="3" fill="#142642" stroke="#25426E" strokeWidth="1" />
            <text x="157" y="16" fill="#E2E8F0" fontSize="8" fontFamily="DM Mono, monospace" textAnchor="middle">Nowcasting App</text>

            <rect x="0" y="34" width="205" height="26" rx="3" fill="#0057FF" />
            <text x="102" y="50" fill="#FFFFFF" fontSize="9" fontFamily="DM Mono, monospace" fontWeight="700" textAnchor="middle">Direct Weather API Ingestion ↗</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
