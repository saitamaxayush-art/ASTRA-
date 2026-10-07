import React, { useEffect, useState, useRef } from 'react';
import CloudCanvas from '../components/CloudCanvas.jsx';
import { Header, Eyebrow } from '../components/SiteChrome.jsx';
import { PLACEHOLDER_METRICS } from '../data/metrics.js';
import { SAMPLE_SCENES, blendImagesOnCanvas } from '../data/sampleImages.js';

const methods = ['Linear', 'Farneback', 'RAFT', 'ASTRA (refined)'];

export default function Demo() {
  const [t, setT] = useState(0.5);
  const [speed, setSpeed] = useState(1);
  const [thermal, setThermal] = useState(false);
  const [method, setMethod] = useState(methods[3]);
  const [compare, setCompare] = useState('Reconstruction');
  const [flow, setFlow] = useState(false);
  const [confidence, setConfidence] = useState(true);
  const [low, setLow] = useState(false);
  const [sliderSplit, setSliderSplit] = useState(50);

  // Image A (t0) state
  const [timeA, setTimeA] = useState('14:00 UTC');
  const [modeA, setModeA] = useState('sample'); // 'sample' | 'upload'
  const [sampleIndexA, setSampleIndexA] = useState(0);
  const [imageAUrl, setImageAUrl] = useState('');
  const fileInputARef = useRef(null);

  // Image B (t1) state
  const [timeB, setTimeB] = useState('14:15 UTC');
  const [modeB, setModeB] = useState('sample'); // 'sample' | 'upload'
  const [sampleIndexB, setSampleIndexB] = useState(0);
  const [imageBUrl, setImageBUrl] = useState('');
  const fileInputBRef = useRef(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [hasGenerated, setHasGenerated] = useState(true);
  const [intermediateUrl, setIntermediateUrl] = useState('');
  const [generatedTimestamp, setGeneratedTimestamp] = useState('14:07:30 UTC');

  // Initialize sample images on client load
  useEffect(() => {
    const sA = SAMPLE_SCENES[sampleIndexA];
    const sB = SAMPLE_SCENES[sampleIndexB];
    if (sA) {
      const imgA = sA.getImgA();
      setImageAUrl(imgA);
      setTimeA(sA.timeA);
    }
    if (sB) {
      const imgB = sB.getImgB();
      setImageBUrl(imgB);
      setTimeB(sB.timeB);
    }
    if (sA) {
      setIntermediateUrl(sA.getIntermediate(0.5));
    }
  }, []);

  // Update sample A
  const handleSelectSampleA = (idx) => {
    setSampleIndexA(idx);
    const s = SAMPLE_SCENES[idx];
    if (s) {
      setImageAUrl(s.getImgA());
      setTimeA(s.timeA);
    }
  };

  // Update sample B
  const handleSelectSampleB = (idx) => {
    setSampleIndexB(idx);
    const s = SAMPLE_SCENES[idx];
    if (s) {
      setImageBUrl(s.getImgB());
      setTimeB(s.timeB);
    }
  };

  // File upload handlers
  const handleUploadA = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageAUrl(ev.target?.result);
        setTimeA('Custom t₀');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadB = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageBUrl(ev.target?.result);
        setTimeB('Custom t₁');
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate intermediate image
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep('Calibrating radiance & computing optical flow...');

    await new Promise((r) => setTimeout(r, 450));
    setGenerationStep('Applying bidirectional temporal warp to t*...');

    await new Promise((r) => setTimeout(r, 400));
    setGenerationStep('Residual U-Net refinement & SRI scoring...');

    await new Promise((r) => setTimeout(r, 450));

    // Generate output
    if (modeA === 'upload' || modeB === 'upload') {
      const blended = await blendImagesOnCanvas(imageAUrl, imageBUrl, t);
      setIntermediateUrl(blended);
    } else {
      const s = SAMPLE_SCENES[sampleIndexA] || SAMPLE_SCENES[0];
      setIntermediateUrl(s.getIntermediate(t));
    }

    setGeneratedTimestamp(
      `t* = ${timeA.replace(' UTC', '')} + ${(t * 15).toFixed(1)}m UTC`
    );
    setIsGenerating(false);
    setHasGenerated(true);
  };

  const metrics = PLACEHOLDER_METRICS.methods[method];

  function exportFile() {
    const a = document.createElement('a');
    a.href = intermediateUrl || '/astra-prototype-mock.nc';
    a.download = `astra-intermediate-reconstruction-${t.toFixed(2)}.png`;
    a.click();
  }

  return (
    <div className="demo-page">
      <Header demo />

      <main className="dashboard">
        <div className="dashboard-title">
          <div>
            <Eyebrow>ASTRA AI · PROTOTYPE WORKSPACE</Eyebrow>
            <h1>Temporal State Reconstruction</h1>
          </div>
          <div className="dashboard-header-tags">
            <span className="prototype-chip">SIMULATED BENCHMARK WORKSPACE</span>
            <span className="prototype-channel-tag">GOES-16 ABI · CH.13 (10.3 μm)</span>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* LEFT: IMAGE & SCENE CONTROLS */}
          <aside className="control-panel panel">
            <h2>Input Photographs</h2>

            {/* SECTION 1: PHOTOGRAPH A (t0) */}
            <div className="image-input-section">
              <div className="section-badge-row">
                <span className="timestamp-badge">FRAME A · t₀</span>
                <input
                  type="text"
                  className="time-tag-input"
                  value={timeA}
                  onChange={(e) => setTimeA(e.target.value)}
                  placeholder="e.g. 14:00 UTC"
                  title="Timestamp for Frame A"
                />
              </div>

              <div className="source-toggle">
                <button
                  type="button"
                  className={`source-tab-btn ${modeA === 'sample' ? 'active' : ''}`}
                  onClick={() => setModeA('sample')}
                >
                  Sample Photos
                </button>
                <button
                  type="button"
                  className={`source-tab-btn ${modeA === 'upload' ? 'active' : ''}`}
                  onClick={() => {
                    setModeA('upload');
                    fileInputARef.current?.click();
                  }}
                >
                  Upload Photo
                </button>
              </div>

              {modeA === 'sample' ? (
                <div className="sample-select-wrap">
                  <select
                    id="sampleA"
                    value={sampleIndexA}
                    onChange={(e) => handleSelectSampleA(+e.target.value)}
                  >
                    {SAMPLE_SCENES.map((s, i) => (
                      <option key={s.id} value={i}>
                        {s.title} ({s.timeA})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="file-upload-box">
                  <input
                    ref={fileInputARef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadA}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="file-pick-btn"
                    onClick={() => fileInputARef.current?.click()}
                  >
                    📁 Choose custom photograph...
                  </button>
                </div>
              )}

              {imageAUrl && (
                <div className="thumbnail-preview">
                  <img src={imageAUrl} alt="Timestamp A observation" />
                  <span className="thumb-caption">{timeA}</span>
                </div>
              )}
            </div>

            <div className="control-divider" />

            {/* SECTION 2: PHOTOGRAPH B (t1) */}
            <div className="image-input-section">
              <div className="section-badge-row">
                <span className="timestamp-badge">FRAME B · t₁</span>
                <input
                  type="text"
                  className="time-tag-input"
                  value={timeB}
                  onChange={(e) => setTimeB(e.target.value)}
                  placeholder="e.g. 14:15 UTC"
                  title="Timestamp for Frame B"
                />
              </div>

              <div className="source-toggle">
                <button
                  type="button"
                  className={`source-tab-btn ${modeB === 'sample' ? 'active' : ''}`}
                  onClick={() => setModeB('sample')}
                >
                  Sample Photos
                </button>
                <button
                  type="button"
                  className={`source-tab-btn ${modeB === 'upload' ? 'active' : ''}`}
                  onClick={() => {
                    setModeB('upload');
                    fileInputBRef.current?.click();
                  }}
                >
                  Upload Photo
                </button>
              </div>

              {modeB === 'sample' ? (
                <div className="sample-select-wrap">
                  <select
                    id="sampleB"
                    value={sampleIndexB}
                    onChange={(e) => handleSelectSampleB(+e.target.value)}
                  >
                    {SAMPLE_SCENES.map((s, i) => (
                      <option key={s.id} value={i}>
                        {s.title} ({s.timeB})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="file-upload-box">
                  <input
                    ref={fileInputBRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadB}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="file-pick-btn"
                    onClick={() => fileInputBRef.current?.click()}
                  >
                    📁 Choose custom photograph...
                  </button>
                </div>
              )}

              {imageBUrl && (
                <div className="thumbnail-preview">
                  <img src={imageBUrl} alt="Timestamp B observation" />
                  <span className="thumb-caption">{timeB}</span>
                </div>
              )}
            </div>

            <div className="control-divider" />

            {/* RECONSTRUCTION PARAMETERS */}
            <label className="field-label" htmlFor="method">
              RECONSTRUCTION MODEL
            </label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {methods.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            {/* GENERATE BUTTON */}
            <div className="generate-btn-wrap">
              <button
                type="button"
                className={`button generate-action-btn ${isGenerating ? 'generating' : ''}`}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner-dot" />
                    <span>Reconstructing...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Generate Intermediate Image</span>
                  </>
                )}
              </button>
              {isGenerating && (
                <span className="generation-step-text">{generationStep}</span>
              )}
            </div>

            <div className="control-divider" />

            <div className="panel-subtitle">DISPLAY LAYERS</div>
            <label className="toggle-row">
              Thermal palette
              <input
                type="checkbox"
                checked={thermal}
                onChange={(e) => setThermal(e.target.checked)}
              />
              <span className="toggle-ui" />
            </label>
            <label className="toggle-row">
              Flow vectors
              <input
                type="checkbox"
                checked={flow}
                onChange={(e) => setFlow(e.target.checked)}
              />
              <span className="toggle-ui" />
            </label>
            <label className="toggle-row">
              Confidence map
              <input
                type="checkbox"
                checked={confidence}
                onChange={(e) => setConfidence(e.target.checked)}
              />
              <span className="toggle-ui" />
            </label>
            <label className="toggle-row">
              Low-confidence marks
              <input
                type="checkbox"
                checked={low}
                onChange={(e) => setLow(e.target.checked)}
              />
              <span className="toggle-ui" />
            </label>

            <div className="control-divider" />

            <label className="field-label" htmlFor="compare">
              VIEW MODE
            </label>
            <select
              id="compare"
              value={compare}
              onChange={(e) => setCompare(e.target.value)}
            >
              <option>Reconstruction</option>
              <option>Side by side</option>
              <option>Slider</option>
              <option>Difference</option>
            </select>
          </aside>

          {/* CENTER: VIEWER */}
          <section className="viewer panel">
            <div className="viewer-head">
              <div>
                <span className="viewer-tag">GOES-16 ABI · CHANNEL 13</span>
                <span className="viewer-sub">
                  10.3 μm Clean IR · Intermediate Synthesis
                </span>
              </div>
              <div className="viewer-meta-tags">
                <span className="viewer-coordinate">{timeA} → {timeB}</span>
                {hasGenerated && (
                  <span className="generated-tag">INTERMEDIATE t* SYNTHESIZED</span>
                )}
              </div>
            </div>

            {/* MAIN CANVAS VIEWER */}
            <div
              className={`viewer-canvas ${flow ? 'show-flow' : ''} ${
                low ? 'show-low' : ''
              }`}
            >
              {intermediateUrl ? (
                <div className="raster-image-wrapper">
                  <img
                    src={intermediateUrl}
                    alt="Generated intermediate satellite state"
                    className={`synthesized-img ${thermal ? 'thermal-filter' : ''} ${
                      compare === 'Difference' ? 'difference-filter' : ''
                    }`}
                  />
                </div>
              ) : (
                <CloudCanvas
                  progress={t}
                  seed={sampleIndexA * 7 + methods.indexOf(method) * 9}
                  thermal={thermal}
                  difference={compare === 'Difference'}
                />
              )}

              {compare === 'Slider' && imageBUrl && (
                <div
                  className="demo-slider-top"
                  style={{ clipPath: `inset(0 ${100 - sliderSplit}% 0 0)` }}
                >
                  <img
                    src={imageBUrl}
                    alt="Frame B at t1"
                    className={`synthesized-img ${thermal ? 'thermal-filter' : ''}`}
                  />
                  <span>FRAME B / {timeB}</span>
                </div>
              )}

              {compare === 'Slider' && (
                <>
                  <div
                    className="demo-slider-divider"
                    style={{ left: `${sliderSplit}%` }}
                  />
                  <input
                    className="demo-slider-range"
                    aria-label="Compare intermediate and boundary frames"
                    type="range"
                    min="5"
                    max="95"
                    value={sliderSplit}
                    onChange={(e) => setSliderSplit(+e.target.value)}
                  />
                </>
              )}

              {confidence && <div className="confidence-overlay" />}
              {flow && (
                <div className="flow-overlay">
                  ↗　→　↘<br />
                  　↗　↘　→<br />
                  →　↗　↘
                </div>
              )}
              {low && <div className="low-overlay" />}

              <span className="canvas-corner">
                {compare === 'Difference'
                  ? 'RESIDUAL DIFFERENCE MAP'
                  : 'SYNTHESIZED STATE Î(t*)'}
              </span>
              <span className="canvas-time">
                {generatedTimestamp} (t = {t.toFixed(2)})
              </span>
            </div>

            {/* SIDE-BY-SIDE VIEW MODE */}
            {compare === 'Side by side' && (
              <div className="side-by-side three-frame-side">
                <div>
                  {imageAUrl ? (
                    <img src={imageAUrl} alt="Frame A" className="side-thumb" />
                  ) : (
                    <CloudCanvas progress={0} seed={sampleIndexA} thermal={thermal} />
                  )}
                  <span>FRAME A / {timeA}</span>
                </div>
                <div className="mid-generated-frame">
                  {intermediateUrl ? (
                    <img src={intermediateUrl} alt="Intermediate" className="side-thumb" />
                  ) : (
                    <CloudCanvas progress={t} seed={sampleIndexA} thermal={thermal} />
                  )}
                  <span>GENERATED Î(t*)</span>
                </div>
                <div>
                  {imageBUrl ? (
                    <img src={imageBUrl} alt="Frame B" className="side-thumb" />
                  ) : (
                    <CloudCanvas progress={1} seed={sampleIndexB} thermal={thermal} />
                  )}
                  <span>FRAME B / {timeB}</span>
                </div>
              </div>
            )}

            <div className="frame-labels">
              <span>
                <i /> FRAME A <b>{timeA}</b>
              </span>
              <span>
                INTERMEDIATE SYNTHESIS <b>t* = {t.toFixed(2)}</b>
              </span>
              <span>
                <i /> FRAME B <b>{timeB}</b>
              </span>
            </div>

            {/* TIMELINE SLIDER */}
            <div className="timeline">
              <div className="timeline-controls">
                <div className="speed-picker">
                  {[0.25, 0.5, 0.75].map((val) => (
                    <button
                      key={val}
                      className={t === val ? 'selected' : ''}
                      onClick={() => setT(val)}
                    >
                      {val === 0.5 ? 'Midpoint (0.5)' : `t=${val}`}
                    </button>
                  ))}
                </div>
                <span className="timeline-time">
                  Requested time: <strong>t = {t.toFixed(2)}</strong> / 1.00
                </span>
              </div>

              <div className="range-wrap">
                <div className="range-ticks">
                  {[0, 0.25, 0.5, 0.75, 1].map((x) => (
                    <button
                      key={x}
                      onClick={() => setT(x)}
                      style={{ left: `${x * 100}%` }}
                      aria-label={`Set intermediate time to ${x}`}
                    />
                  ))}
                </div>
                <input
                  aria-label="Target intermediate interpolation time t"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={t}
                  onChange={(e) => setT(+e.target.value)}
                />
              </div>

              <div className="time-labels">
                <span>{timeA} (t₀ = 0.0)</span>
                <span>TARGET RECONSTRUCTION TIME (t*)</span>
                <span>{timeB} (t₁ = 1.0)</span>
              </div>
            </div>
          </section>

          {/* RIGHT: DIAGNOSTICS */}
          <aside className="diagnostics panel">
            <div className="diagnostics-title">
              <div>
                <span className="viewer-tag">EVALUATION METRICS</span>
                <h2>Reliability & SRI</h2>
              </div>
              <span className="gate-badge gate-pass">GATE PASSED</span>
            </div>

            <div className="dashboard-sri">
              <div className="dashboard-gauge">
                <span>{metrics.sri}</span>
                <small>SRI</small>
              </div>
              <div>
                <strong>65% Operational Gate</strong>
                <span className="sri-note">RECONSTRUCTION ACCEPTED</span>
              </div>
            </div>

            <div className="diag-metrics">
              {[
                ['PSNR', metrics.psnr, 'dB'],
                ['SSIM', metrics.ssim, 'index'],
                ['MSE', metrics.mse, '×10⁻²'],
                ['Latency', metrics.latency, 'infer']
              ].map(([name, value, unit]) => (
                <div key={name}>
                  <span>{name}</span>
                  <strong>{value}</strong>
                  <small>{unit}</small>
                </div>
              ))}
            </div>

            <div className="consistency">
              <span>Bidirectional Flow Consistency</span>
              <b>
                <i /> 94.8% ALIGNED
              </b>
            </div>

            <div className="sri-explain">
              Scientific Reliability Index (SRI) quantifies motion advection, residual energy, and thermal bounds between {timeA} and {timeB}.
            </div>

            <button className="button export-button" onClick={exportFile}>
              Download intermediate image <span>↓</span>
            </button>
            <p className="export-note">
              Exports the generated intermediate reconstruction at {generatedTimestamp}.
            </p>
          </aside>
        </div>

        <footer className="dashboard-footer">
          <span>ASTRA AI · ENGINEERING DESIGN & INNOVATION · GROUP 17 · VIT PUNE</span>
          <span>INTERMEDIATE STATE RECONSTRUCTION</span>
          <a href="/privacy">PRIVACY</a>
        </footer>
      </main>
    </div>
  );
}
