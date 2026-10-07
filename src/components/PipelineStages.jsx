import React, { useEffect, useRef, useState } from 'react';

export const PIPELINE_STAGES = [
  {
    step: '01',
    id: 'stage-1',
    badge: 'STAGE 01 · CALIBRATION',
    title: 'Sensor Ingestion & Radiometric Calibration',
    subtitle: 'Raw Sensor Counts (DN) → Kelvin Brightness Temperature',
    description: 'Reads raw GOES-16 10.3 μm detector counts and inverts the Planck function into thermodynamic Kelvin temperature fields (190 K – 310 K).',
    tasks: [
      'Extract 14-bit integer counts (DN) from L1b NetCDF4 files at timestamps t₀ and t₁.',
      'Invert Planck radiation equation using ABI wavenumber coefficients (c₁, c₂, ν).',
      'Crop into normalized 256×256 analysis tiles.'
    ],
    input: 'GOES-16 ABI Band 13 NetCDF4 (DN counts)',
    output: 'Calibrated 256×256 Kelvin array [190 K – 310 K]',
    visualType: 'calibration'
  },
  {
    step: '02',
    id: 'stage-2',
    badge: 'STAGE 02 · MOTION ESTIMATION',
    title: 'Bidirectional Optical Flow Estimation',
    subtitle: 'Dense 2D Velocity Fields via RAFT-Small',
    description: 'Computes dense pixel displacement vectors in both directions (forward t₀ → t₁ and backward t₁ → t₀) to capture cloud rotation and wind shear.',
    tasks: [
      'Extract multi-scale convolutional features from boundary frames I₀ and I₁.',
      'Compute 4D correlation volumes and run 12 recurrent GRU motion updates.',
      'Output dense forward flow F₀→₁ and backward flow F₁→₀ with sub-pixel accuracy.'
    ],
    input: 'Calibrated boundary frames I₀ and I₁',
    output: 'Sub-pixel vector fields F₀→₁ & F₁→₀ (u, v velocity)',
    visualType: 'motion'
  },
  {
    step: '03',
    id: 'stage-3',
    badge: 'STAGE 03 · TEMPORAL WARPING',
    title: 'Time-Conditioned Bidirectional Warping',
    subtitle: 'Continuous Bilinear Grid Advection at Target Instant t*',
    description: 'Scales optical flow vectors to the requested query time t* and warps both boundary observations forward and backward, eliminating linear ghosting.',
    tasks: [
      'Scale vectors by time scalars: F_{t*→0} = −t* · F₀→₁ and F_{t*→1} = −(1−t*) · F₁→₀.',
      'Perform differentiable backward bilinear sampling on both boundary frames.',
      'Fuse warped fields into a motion-compensated intermediate base state.'
    ],
    input: 'Boundary frames + flow fields + query timestamp t*',
    output: 'Motion-compensated base intermediate frame Ĩ(t*)',
    visualType: 'warping'
  },
  {
    step: '04',
    id: 'stage-4',
    badge: 'STAGE 04 · RESIDUAL REFINEMENT',
    title: 'Convective Residual Refinement (U-Net)',
    subtitle: 'Deep Synthesis of Non-Conservative Storm Growth',
    description: 'Passes the motion base into a lightweight Residual U-Net to synthesize localized convective updrafts and cloud anvil growth that motion advection misses.',
    tasks: [
      'Stack warped base frames, difference tensors, and query time t*.',
      'Pass through 4-stage encoder-decoder with skip connections.',
      'Add learned residual ΔI to the warped base: Î(t*) = Ĩ(t*) + ΔI(t*).'
    ],
    input: 'Warped base frame + multi-channel boundary tensor',
    output: 'Refined intermediate atmospheric state Î(t*)',
    visualType: 'residual'
  },
  {
    step: '05',
    id: 'stage-5',
    badge: 'STAGE 05 · RELIABILITY GATING',
    title: 'Scientific Reliability Index (SRI)',
    subtitle: 'Spatial Uncertainty Heatmap & Confidence Score',
    description: 'Evaluates photometric consistency, flow divergence, and thermal gradients across every pixel to generate a spatial reliability mask and overall SRI score.',
    tasks: [
      'Calculate bidirectional photometric consistency error |I_{warp,0} − I_{warp,1}|.',
      'Check flow divergence ∇·F and vortex curl preservation.',
      'Aggregate pixel confidence mask and global reliability score (92.6% SRI).'
    ],
    input: 'Refined intermediate frame Î(t*) + boundary checks',
    output: 'Spatial uncertainty mask + Global SRI score (92.6%)',
    visualType: 'reliability'
  },
  {
    step: '06',
    id: 'stage-6',
    badge: 'STAGE 06 · OPERATIONAL EXPORT',
    title: 'CF-Compliant NetCDF4 & NWP Integration',
    subtitle: 'Standardized Weather Model Ingestion',
    description: 'Packages reconstructed intermediate fields, uncertainty layers, and geospatial coordinates into CF-1.8 NetCDF4 files ready for weather forecast models.',
    tasks: [
      'Write float32 Brightness Temperature array with geospatial coordinate grid.',
      'Embed spatial confidence index and quality flags for automated assimilation.',
      'Export CF-1.8 compliant `.nc` dataset for HRRR and nowcasting pipelines.'
    ],
    input: 'Synthesized intermediate array + confidence layers',
    output: 'Operational NetCDF4 dataset (CF-1.8 compliant)',
    visualType: 'export'
  }
];

export default function PipelineStages() {
  const [activeStage, setActiveStage] = useState(0);
  const cardRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      const triggerPoint = window.innerHeight * 0.45;
      cardRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // If the top of the card is at or above the trigger point
        if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
          setActiveStage(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="pipeline-scroll-container">
      {/* Passive Scroll Progress Indicator (No physical buttons) */}
      <div className="pipeline-scroll-indicator" aria-live="polite">
        <div className="indicator-content">
          <div className="indicator-status">
            <span className="indicator-pulse" />
            <span className="indicator-text">
              SCROLL TO REVEAL · STAGE <b>0{activeStage + 1}</b> OF 06
            </span>
            <span className="indicator-title-tag">{PIPELINE_STAGES[activeStage].title}</span>
          </div>
          <div className="indicator-track">
            <div
              className="indicator-fill"
              style={{ width: `${((activeStage + 1) / PIPELINE_STAGES.length) * 100}%` }}
            />
          </div>
          <div className="indicator-steps">
            {PIPELINE_STAGES.map((s, idx) => (
              <span
                key={s.step}
                className={`indicator-step-dot ${idx <= activeStage ? 'is-active' : ''}`}
              >
                0{idx + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stacked Cards Stream (Scroll-and-Reveal Animation) */}
      <div className="pipeline-cards-stack">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isRevealed = idx <= activeStage;
          const isCurrent = idx === activeStage;

          return (
            <article
              key={stage.id}
              id={stage.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              className={`pipeline-stage-card ${isRevealed ? 'revealed' : ''} ${isCurrent ? 'current-card' : ''}`}
              style={{
                // Subtle stack offset so cards layer naturally on scroll
                top: `${88 + idx * 8}px`,
                zIndex: idx + 1
              }}
            >
              {/* Top Meta Line */}
              <div className="card-top-row">
                <div className="card-badge-group">
                  <span className="card-stage-chip">{stage.badge}</span>
                  <span className="card-step-count">0{idx + 1} / 06</span>
                </div>
                <span className="card-scroll-badge">
                  {isCurrent ? '● IN VIEW' : idx < activeStage ? '✓ PASSED' : '↓ SCROLL TO REVEAL'}
                </span>
              </div>

              {/* Title & Concise Summary */}
              <div className="card-heading-box">
                <h3 className="card-title">{stage.title}</h3>
                <span className="card-subtitle">{stage.subtitle}</span>
                <p className="card-desc">{stage.description}</p>
              </div>

              {/* Split Content: Compact Task Checklist + Solution Picture */}
              <div className="card-body-split">
                {/* Left: Small concise task list */}
                <div className="card-details-panel">
                  <span className="panel-micro-title">WHAT YOU DO IN THIS STEP:</span>
                  <ul className="card-task-list">
                    {stage.tasks.map((task, tIdx) => (
                      <li key={tIdx}>
                        <span className="task-bullet">{tIdx + 1}</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="card-specs-row">
                    <div className="spec-item">
                      <span className="spec-label">INPUT</span>
                      <span className="spec-val">{stage.input}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">OUTPUT</span>
                      <span className="spec-val highlight-val">{stage.output}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Solution Picture */}
                <div className="card-visual-panel">
                  <div className="visual-header-tag">
                    <span className="visual-dot" />
                    <span>PICTURE OF THE SOLUTION</span>
                  </div>
                  <div className="visual-display-frame">
                    {stage.visualType === 'calibration' && <CalibrationVisual />}
                    {stage.visualType === 'motion' && <MotionVisual />}
                    {stage.visualType === 'warping' && <WarpingVisual />}
                    {stage.visualType === 'residual' && <ResidualVisual />}
                    {stage.visualType === 'reliability' && <ReliabilityVisual />}
                    {stage.visualType === 'export' && <ExportVisual />}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   SOLUTION PICTURES (Crisp, High-Contrast, Clear SVG Visuals)
   ========================================================================= */

// STAGE 01: Calibration Solution
function CalibrationVisual() {
  return (
    <div className="pic-wrapper">
      <svg viewBox="0 0 500 240" className="pic-svg" aria-label="Radiometric Calibration Solution">
        <defs>
          <linearGradient id="irGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1035" />
            <stop offset="35%" stopColor="#0057ff" />
            <stop offset="75%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="kelvinScale" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#0057ff" />
            <stop offset="100%" stopColor="#1e1035" />
          </linearGradient>
        </defs>

        <rect width="500" height="240" fill="#090E17" rx="8" />

        {/* Left: Raw Digital Numbers */}
        <g transform="translate(16, 20)">
          <rect width="145" height="155" rx="6" fill="#131B2A" stroke="#253550" strokeWidth="1.2" />
          <text x="12" y="24" fill="#94A3B8" fontSize="11" fontWeight="700">RAW SENSOR (DN)</text>
          <text x="12" y="38" fill="#64748B" fontSize="10">GOES-16 ABI Ch.13</text>
          <g transform="translate(12, 50)">
            {[['0x3B8', '0x4F1'], ['0x2A1', '0x7C9'], ['0x1E4', '0x62B']].map((row, r) => (
              <g key={r} transform={`translate(0, ${r * 32})`}>
                {row.map((val, c) => (
                  <g key={c} transform={`translate(${c * 62}, 0)`}>
                    <rect width="56" height="26" rx="3" fill="#1A253A" stroke="#2F4265" strokeWidth="1" />
                    <text x="28" y="17" fill="#38BDF8" fontSize="11" textAnchor="middle" fontWeight="600">{val}</text>
                  </g>
                ))}
              </g>
            ))}
          </g>
        </g>

        {/* Arrow / Planck Formula */}
        <g transform="translate(172, 85)">
          <path d="M 0 15 L 34 15" stroke="#0057FF" strokeWidth="3" />
          <path d="M 28 8 L 36 15 L 28 22" stroke="#0057FF" strokeWidth="3" fill="none" />
          <text x="18" y="38" fill="#38BDF8" fontSize="10" textAnchor="middle" fontWeight="700">PLANCK</text>
          <text x="18" y="50" fill="#94A3B8" fontSize="9" textAnchor="middle">INVERSION</text>
        </g>

        {/* Right: Calibrated False-Color Satellite Heatmap */}
        <g transform="translate(225, 20)">
          <rect width="258" height="155" rx="6" fill="#131B2A" stroke="#0057FF" strokeWidth="1.5" />
          <text x="14" y="24" fill="#38BDF8" fontSize="11" fontWeight="700">CALIBRATED FIELD Tb (K)</text>
          <text x="14" y="38" fill="#E2E8F0" fontSize="10">10.3 μm Clean IR Surface &amp; Clouds</text>
          <g transform="translate(14, 48)">
            <rect width="230" height="92" rx="4" fill="url(#irGrad)" />
            <circle cx="115" cy="46" r="28" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="115" cy="46" r="14" fill="#FFFFFF" />
            <text x="115" y="50" fill="#090E17" fontSize="11" fontWeight="800" textAnchor="middle">198 K</text>
            <text x="115" y="82" fill="#FFFFFF" fontSize="10" fontWeight="600" textAnchor="middle">Deep Convective Updraft</text>
          </g>
        </g>

        {/* Bottom Kelvin Colorbar */}
        <g transform="translate(25, 195)">
          <rect width="450" height="12" rx="3" fill="url(#kelvinScale)" stroke="#253550" strokeWidth="1" />
          <text x="0" y="26" fill="#FFFFFF" fontSize="10" fontWeight="700">190 K (Cold Storm Tops)</text>
          <text x="225" y="26" fill="#38BDF8" fontSize="10" textAnchor="middle" fontWeight="600">240 K (Mid-troposphere)</text>
          <text x="450" y="26" fill="#94A3B8" fontSize="10" textAnchor="end" fontWeight="700">310 K (Warm Sea)</text>
        </g>
      </svg>
    </div>
  );
}

// STAGE 02: Motion Solution
function MotionSolutionPicture() {
  return (
    <div className="pic-wrapper">
      <svg viewBox="0 0 500 240" className="pic-svg" aria-label="Optical Flow Motion Solution">
        <defs>
          <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#38BDF8" />
          </marker>
          <marker id="arrowHeadFast" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#F59E0B" />
          </marker>
        </defs>

        <rect width="500" height="240" fill="#090E17" rx="8" />

        {/* Central Vortex & Vector Quiver */}
        <g transform="translate(170, 115)">
          <circle cx="0" cy="0" r="75" fill="#15243D" opacity="0.7" />
          <circle cx="0" cy="0" r="45" fill="#1C355E" opacity="0.8" />
          <circle cx="0" cy="0" r="14" fill="#0D1829" stroke="#38BDF8" strokeWidth="1.5" />
          <text x="0" y="4" fill="#38BDF8" fontSize="10" fontWeight="800" textAnchor="middle">EYE</text>

          {/* Vectors around storm */}
          <path d="M 0 -60 L 30 -55" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrowHead)" />
          <path d="M 50 -35 L 68 -10" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrowHead)" />
          <path d="M 60 10 L 55 40" stroke="#F59E0B" strokeWidth="2.8" markerEnd="url(#arrowHeadFast)" />
          <path d="M 40 45 L 15 65" stroke="#F59E0B" strokeWidth="2.8" markerEnd="url(#arrowHeadFast)" />
          <path d="M 0 60 L -30 55" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrowHead)" />
          <path d="M -50 35 L -68 10" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrowHead)" />
          <path d="M -60 -10 L -55 -40" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrowHead)" />
          <path d="M -40 -45 L -15 -65" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrowHead)" />
        </g>

        {/* Right Info Card */}
        <g transform="translate(290, 25)">
          <rect width="190" height="185" rx="6" fill="#111B2C" stroke="#0057FF" strokeWidth="1.5" />
          <text x="14" y="24" fill="#38BDF8" fontSize="11" fontWeight="700">DENSE FLOW VECTORS</text>
          <text x="14" y="42" fill="#FFFFFF" fontSize="14" fontWeight="700">F₀→₁ and F₁→₀</text>

          <g transform="translate(14, 58)">
            <rect width="162" height="24" rx="3" fill="#182740" />
            <text x="10" y="16" fill="#E2E8F0" fontSize="10" fontWeight="600">Model: RAFT-Small (12 GRU)</text>
          </g>

          <g transform="translate(14, 90)">
            <rect width="162" height="24" rx="3" fill="#182740" />
            <text x="10" y="16" fill="#E2E8F0" fontSize="10" fontWeight="600">Precision: Sub-pixel 0.1 px</text>
          </g>

          <g transform="translate(14, 122)">
            <rect width="162" height="24" rx="3" fill="#182740" />
            <text x="10" y="16" fill="#F59E0B" fontSize="10" fontWeight="700">Peak Velocity: 118 km/h</text>
          </g>

          <text x="14" y="168" fill="#94A3B8" fontSize="9">Bidirectional advection vectors</text>
        </g>

        {/* Left Legend */}
        <g transform="translate(20, 25)">
          <rect width="130" height="60" rx="4" fill="#111B2C" stroke="#223350" strokeWidth="1" />
          <circle cx="16" cy="18" r="4" fill="#38BDF8" />
          <text x="26" y="22" fill="#E2E8F0" fontSize="10">Steady Cloud Flow</text>
          <circle cx="16" cy="40" r="4" fill="#F59E0B" />
          <text x="26" y="44" fill="#E2E8F0" fontSize="10">Jet Core Shear</text>
        </g>
      </svg>
    </div>
  );
}

// STAGE 03: Warping Solution
function WarpingVisual() {
  return (
    <div className="pic-wrapper">
      <svg viewBox="0 0 500 240" className="pic-svg" aria-label="Bidirectional Warping Solution">
        <defs>
          <linearGradient id="warpCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0057FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        <rect width="500" height="240" fill="#090E17" rx="8" />

        {/* Observed Frame t0 */}
        <g transform="translate(20, 45)">
          <rect width="115" height="140" rx="6" fill="#121D2E" stroke="#253A5A" strokeWidth="1.2" />
          <text x="10" y="22" fill="#94A3B8" fontSize="10" fontWeight="700">OBSERVED</text>
          <text x="10" y="38" fill="#FFFFFF" fontSize="13" fontWeight="700">t₀ (00:00)</text>
          <circle cx="58" cy="80" r="28" fill="#25426E" />
          <circle cx="48" cy="74" r="14" fill="#60A5FA" opacity="0.9" />
          <text x="58" y="124" fill="#94A3B8" fontSize="9" textAnchor="middle">Initial Position X₀</text>
        </g>

        {/* Forward Warp Arrow */}
        <g transform="translate(142, 95)">
          <path d="M 0 15 L 30 15" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="3 2" />
          <path d="M 24 9 L 32 15 L 24 21" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
          <text x="16" y="6" fill="#38BDF8" fontSize="10" textAnchor="middle" fontWeight="700">+t*·F</text>
        </g>

        {/* Target Frame t* */}
        <g transform="translate(182, 30)">
          <rect width="136" height="170" rx="6" fill="#0E1A2C" stroke="#0057FF" strokeWidth="2" />
          <rect width="136" height="26" rx="5" fill="#0057FF" />
          <text x="68" y="17" fill="#FFFFFF" fontSize="10" fontWeight="800" textAnchor="middle">TARGET RECON</text>
          <text x="68" y="44" fill="#38BDF8" fontSize="12" fontWeight="800" textAnchor="middle">t* (00:07:30)</text>
          <circle cx="68" cy="98" r="32" fill="url(#warpCore)" />
          <circle cx="68" cy="94" r="16" fill="#FFFFFF" />
          <text x="68" y="98" fill="#0057FF" fontSize="9" fontWeight="800" textAnchor="middle">ALIGNED</text>
          <text x="68" y="148" fill="#38BDF8" fontSize="9" fontWeight="700" textAnchor="middle">Bilinear Grid Advection</text>
        </g>

        {/* Backward Warp Arrow */}
        <g transform="translate(325, 95)">
          <path d="M 32 15 L 2 15" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="3 2" />
          <path d="M 8 9 L 0 15 L 8 21" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
          <text x="16" y="6" fill="#38BDF8" fontSize="10" textAnchor="middle" fontWeight="700">−(1−t*)·F</text>
        </g>

        {/* Observed Frame t1 */}
        <g transform="translate(365, 45)">
          <rect width="115" height="140" rx="6" fill="#121D2E" stroke="#253A5A" strokeWidth="1.2" />
          <text x="10" y="22" fill="#94A3B8" fontSize="10" fontWeight="700">OBSERVED</text>
          <text x="10" y="38" fill="#FFFFFF" fontSize="13" fontWeight="700">t₁ (00:15)</text>
          <circle cx="58" cy="80" r="28" fill="#25426E" />
          <circle cx="68" cy="74" r="14" fill="#60A5FA" opacity="0.9" />
          <text x="58" y="124" fill="#94A3B8" fontSize="9" textAnchor="middle">Final Position X₁</text>
        </g>

        <text x="250" y="225" fill="#CBD5E1" fontSize="10" textAnchor="middle" fontWeight="500">
          Deforms pixels along physical trajectory — eliminates ghosting &amp; double-edges
        </text>
      </svg>
    </div>
  );
}

// STAGE 04: Residual U-Net Solution
function ResidualVisual() {
  return (
    <div className="pic-wrapper">
      <svg viewBox="0 0 500 240" className="pic-svg" aria-label="Residual Refinement Solution">
        <rect width="500" height="240" fill="#090E17" rx="8" />

        {/* U-Net Mini Architecture */}
        <g transform="translate(20, 20)">
          <rect width="460" height="90" rx="6" fill="#101A2B" stroke="#21324E" strokeWidth="1.2" />
          <text x="14" y="20" fill="#38BDF8" fontSize="10" fontWeight="700">RESIDUAL U-NET ARCHITECTURE</text>

          {/* Blocks */}
          <rect x="25" y="35" width="40" height="42" rx="3" fill="#1E3355" />
          <text x="45" y="60" fill="#E2E8F0" fontSize="9" textAnchor="middle" fontWeight="600">ENC</text>

          <rect x="80" y="42" width="35" height="35" rx="3" fill="#1E3355" />
          <text x="97" y="63" fill="#E2E8F0" fontSize="9" textAnchor="middle" fontWeight="600">ENC2</text>

          {/* Bottleneck */}
          <rect x="135" y="48" width="55" height="28" rx="3" fill="#0057FF" stroke="#38BDF8" strokeWidth="1.2" />
          <text x="162" y="66" fill="#FFFFFF" fontSize="9" textAnchor="middle" fontWeight="700">LATENT</text>

          {/* Skip connection line */}
          <path d="M 65 42 L 230 42" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />

          <rect x="210" y="42" width="35" height="35" rx="3" fill="#1A3A60" />
          <text x="227" y="63" fill="#E2E8F0" fontSize="9" textAnchor="middle" fontWeight="600">DEC2</text>

          <rect x="260" y="35" width="40" height="42" rx="3" fill="#1A3A60" />
          <text x="280" y="60" fill="#E2E8F0" fontSize="9" textAnchor="middle" fontWeight="600">DEC</text>

          {/* Output delta */}
          <path d="M 310 56 L 335 56" stroke="#F59E0B" strokeWidth="2.5" />
          <path d="M 330 50 L 337 56 L 330 62" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
          <text x="375" y="54" fill="#F59E0B" fontSize="12" fontWeight="800">ΔI(t*)</text>
          <text x="375" y="68" fill="#94A3B8" fontSize="9">Residual Delta</text>
        </g>

        {/* Synthesis Math Breakdown */}
        <g transform="translate(20, 125)">
          {/* Warped Base */}
          <rect x="0" y="0" width="130" height="95" rx="5" fill="#101A2B" stroke="#223350" strokeWidth="1" />
          <text x="12" y="20" fill="#94A3B8" fontSize="10" fontWeight="600">WARPED BASE</text>
          <text x="12" y="36" fill="#FFFFFF" fontSize="12" fontWeight="700">Ĩ(t*) Base Flow</text>
          <circle cx="65" cy="65" r="22" fill="#25426E" />
          <text x="65" y="68" fill="#94A3B8" fontSize="9" textAnchor="middle">Pure Motion</text>

          <text x="145" y="54" fill="#38BDF8" fontSize="22" fontWeight="800">+</text>

          {/* Learned Convective Updraft */}
          <rect x="165" y="0" width="135" height="95" rx="5" fill="#101A2B" stroke="#F59E0B" strokeWidth="1.2" />
          <text x="12" y="20" fill="#F59E0B" fontSize="10" fontWeight="700">CONVECTIVE DELTA</text>
          <text x="12" y="36" fill="#FFFFFF" fontSize="12" fontWeight="700">ΔI(t*) Updraft</text>
          <circle cx="67" cy="65" r="14" fill="#F59E0B" opacity="0.9" />
          <text x="67" y="69" fill="#000000" fontSize="9" fontWeight="800" textAnchor="middle">NEW CELL</text>

          <text x="315" y="54" fill="#38BDF8" fontSize="22" fontWeight="800">=</text>

          {/* Final Refined State */}
          <rect x="335" y="0" width="145" height="95" rx="5" fill="#101A2B" stroke="#0057FF" strokeWidth="1.5" />
          <text x="12" y="20" fill="#38BDF8" fontSize="10" fontWeight="700">FINAL STATE</text>
          <text x="12" y="36" fill="#FFFFFF" fontSize="12" fontWeight="700">Î(t*) Refined</text>
          <circle cx="72" cy="65" r="24" fill="#0057FF" />
          <circle cx="72" cy="65" r="12" fill="#FFFFFF" />
          <text x="72" y="69" fill="#0057FF" fontSize="9" fontWeight="800" textAnchor="middle">SHARP</text>
        </g>
      </svg>
    </div>
  );
}

// STAGE 05: Reliability Solution
function ReliabilityVisual() {
  return (
    <div className="pic-wrapper">
      <svg viewBox="0 0 500 240" className="pic-svg" aria-label="Scientific Reliability Solution">
        <rect width="500" height="240" fill="#090E17" rx="8" />

        {/* Spatial Uncertainty Heatmap */}
        <g transform="translate(20, 20)">
          <rect width="250" height="200" rx="6" fill="#101A2B" stroke="#223350" strokeWidth="1.2" />
          <text x="14" y="24" fill="#38BDF8" fontSize="11" fontWeight="700">SPATIAL UNCERTAINTY MAP</text>
          <text x="14" y="38" fill="#94A3B8" fontSize="10">Pixel confidence mask C(x,y)</text>

          <g transform="translate(14, 48)">
            <rect width="222" height="110" rx="4" fill="#0B253D" />
            <circle cx="111" cy="55" r="48" fill="#0057FF" opacity="0.6" />
            <ellipse cx="111" cy="55" rx="34" ry="24" fill="#10B981" opacity="0.5" />
            <circle cx="80" cy="45" r="14" fill="#F59E0B" opacity="0.8" />
            <text x="80" y="48" fill="#FFFFFF" fontSize="9" fontWeight="800" textAnchor="middle">!</text>
            <text x="111" y="58" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle">96% Confident</text>
            <text x="111" y="70" fill="#A7F3D0" fontSize="9" textAnchor="middle">Laminar Flow</text>
          </g>

          <g transform="translate(14, 172)">
            <circle cx="6" cy="6" r="4" fill="#10B981" />
            <text x="16" y="10" fill="#E2E8F0" fontSize="9">High (&gt;90%)</text>
            <circle cx="100" cy="6" r="4" fill="#F59E0B" />
            <text x="110" y="10" fill="#E2E8F0" fontSize="9">Caution (70–90%)</text>
          </g>
        </g>

        {/* SRI Score Display */}
        <g transform="translate(290, 20)">
          <rect width="190" height="200" rx="6" fill="#101A2B" stroke="#0057FF" strokeWidth="1.5" />
          <text x="14" y="24" fill="#38BDF8" fontSize="11" fontWeight="700">SRI RELIABILITY</text>

          {/* Radial score ring */}
          <g transform="translate(95, 82)">
            <circle cx="0" cy="0" r="42" fill="#0D1829" stroke="#1E2E48" strokeWidth="7" />
            <circle
              cx="0"
              cy="0"
              r="42"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="7"
              strokeDasharray="264"
              strokeDashoffset="20"
              strokeLinecap="round"
              transform="rotate(-90)"
            />
            <text x="0" y="6" fill="#FFFFFF" fontSize="22" fontWeight="800" textAnchor="middle">92.6%</text>
            <text x="0" y="20" fill="#10B981" fontSize="9" fontWeight="700" textAnchor="middle">PASS · VALID</text>
          </g>

          {/* Checks */}
          <g transform="translate(14, 138)">
            <text x="0" y="12" fill="#10B981" fontSize="10">✓</text>
            <text x="14" y="12" fill="#E2E8F0" fontSize="10">Photometric Consistency</text>
            <text x="0" y="28" fill="#10B981" fontSize="10">✓</text>
            <text x="14" y="28" fill="#E2E8F0" fontSize="10">Flow Divergence Preserved</text>
            <text x="0" y="44" fill="#10B981" fontSize="10">✓</text>
            <text x="14" y="44" fill="#E2E8F0" fontSize="10">Lapse Rate Conservation</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

// STAGE 06: NetCDF Export Solution
function ExportVisual() {
  return (
    <div className="pic-wrapper">
      <svg viewBox="0 0 500 240" className="pic-svg" aria-label="NetCDF4 Export Solution">
        <rect width="500" height="240" fill="#090E17" rx="8" />

        {/* 3D Scientific Cube */}
        <g transform="translate(20, 20)">
          <rect width="230" height="200" rx="6" fill="#101A2B" stroke="#223350" strokeWidth="1.2" />
          <text x="14" y="24" fill="#38BDF8" fontSize="11" fontWeight="700">NETCDF4 MULTI-LAYER CUBE</text>
          <text x="14" y="38" fill="#94A3B8" fontSize="10">Dimensions: [time: 1, lat: 256, lon: 256]</text>

          <g transform="translate(40, 55)">
            <polygon points="0,50 70,18 140,50 70,82" fill="#1A2942" stroke="#334B73" strokeWidth="1.2" />
            <text x="70" y="54" fill="#94A3B8" fontSize="9" textAnchor="middle">Layer 3: residual_delta</text>

            <polygon points="0,30 70,-2 140,30 70,62" fill="#123B68" stroke="#0057FF" strokeWidth="1.2" />
            <text x="70" y="34" fill="#38BDF8" fontSize="9" textAnchor="middle">Layer 2: sri_confidence</text>

            <polygon points="0,10 70,-22 140,10 70,42" fill="#0057FF" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="70" y="14" fill="#FFFFFF" fontSize="9" fontWeight="700" textAnchor="middle">Layer 1: brightness_temp (K)</text>
          </g>

          <text x="14" y="184" fill="#38BDF8" fontSize="10" fontWeight="600">CF-1.8 Compliant · 2km Geostationary</text>
        </g>

        {/* Right: Downstream Ingestion */}
        <g transform="translate(270, 20)">
          <rect width="210" height="200" rx="6" fill="#101A2B" stroke="#0057FF" strokeWidth="1.5" />
          <text x="14" y="24" fill="#38BDF8" fontSize="11" fontWeight="700">OPERATIONAL INTEGRATION</text>

          <g transform="translate(14, 38)">
            <rect width="182" height="60" rx="4" fill="#0A1220" />
            <text x="8" y="18" fill="#10B981" fontSize="9">$ ncdump -h astra_recon.nc</text>
            <text x="8" y="34" fill="#E2E8F0" fontSize="9">float Tb(time, y, x) [K] ;</text>
            <text x="8" y="48" fill="#38BDF8" fontSize="9">float sri(time, y, x) [0..1] ;</text>
          </g>

          <g transform="translate(14, 110)">
            <rect x="0" y="0" width="85" height="30" rx="3" fill="#162740" stroke="#253E68" strokeWidth="1" />
            <text x="42" y="19" fill="#E2E8F0" fontSize="9" textAnchor="middle" fontWeight="600">HRRR Model</text>

            <rect x="97" y="0" width="85" height="30" rx="3" fill="#162740" stroke="#253E68" strokeWidth="1" />
            <text x="139" y="19" fill="#E2E8F0" fontSize="9" textAnchor="middle" fontWeight="600">Nowcast Radar</text>

            <rect x="0" y="38" width="182" height="34" rx="3" fill="#0057FF" />
            <text x="91" y="59" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle">Weather Service Ingestion ↗</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
