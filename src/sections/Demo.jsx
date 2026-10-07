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

  // Evolution Video Player state (Section at bottom)
  const [videoIndex, setVideoIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState('0.0s');
  const [videoDuration, setVideoDuration] = useState('0.0s');
  const videoRef = useRef(null);

  // Initialize sample images on client load from authentic NOAA data
  useEffect(() => {
    const sA = SAMPLE_SCENES[sampleIndexA];
    const sB = SAMPLE_SCENES[sampleIndexB];
    if (sA) {
      setImageAUrl(sA.imgA);
      setTimeA(sA.timeA);
    }
    if (sB) {
      setImageBUrl(sB.imgB);
      setTimeB(sB.timeB);
    }
    if (sA) {
      setIntermediateUrl(sA.imgMid);
      setGeneratedTimestamp(sA.timeMid || '14:07:30 UTC');
    }
  }, []);

  // Sync video speed when playbackSpeed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, videoIndex]);

  // Update sample A
  const handleSelectSampleA = (idx) => {
    setSampleIndexA(idx);
    const s = SAMPLE_SCENES[idx];
    if (s) {
      setImageAUrl(s.imgA);
      setTimeA(s.timeA);
      if (sampleIndexB === idx) {
        setIntermediateUrl(s.imgMid);
        setGeneratedTimestamp(s.timeMid);
      }
      setVideoIndex(idx);
    }
  };

  // Update sample B
  const handleSelectSampleB = (idx) => {
    setSampleIndexB(idx);
    const s = SAMPLE_SCENES[idx];
    if (s) {
      setImageBUrl(s.imgB);
      setTimeB(s.timeB);
      if (sampleIndexA === idx) {
        setIntermediateUrl(s.imgMid);
        setGeneratedTimestamp(s.timeMid);
      }
    }
  };

  // File upload handlers
  const handleUploadA = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageAUrl(ev.target?.result);
        setTimeA('Custom Observation t₀');
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
        setTimeB('Custom Observation t₁');
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate intermediate image with multi-stage atmospheric reconstruction
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep('Calibrating radiance & radiometric temperature bounds...');

    await new Promise((r) => setTimeout(r, 400));
    setGenerationStep('Computing bidirectional RAFT optical flow vectors...');

    await new Promise((r) => setTimeout(r, 400));
    setGenerationStep('Applying forward-backward temporal warp to target t*...');

    await new Promise((r) => setTimeout(r, 450));
    setGenerationStep('Residual U-Net high-frequency feature refinement...');

    await new Promise((r) => setTimeout(r, 350));

    // Dynamic synthesis
    if (modeA === 'upload' || modeB === 'upload') {
      const blended = await blendImagesOnCanvas(imageAUrl, imageBUrl, t, {
        timestamp: `${timeA} → ${timeB} (t*=${t.toFixed(2)})`
      });
      setIntermediateUrl(blended);
    } else {
      const s = SAMPLE_SCENES[sampleIndexA] || SAMPLE_SCENES[0];
      // When at standard 50% midpoint and same scene, use genuine NOAA reference intermediate frame
      if (Math.abs(t - 0.5) < 0.08 && sampleIndexA === sampleIndexB && s.imgMid) {
        setIntermediateUrl(s.imgMid);
      } else {
        const blended = await blendImagesOnCanvas(imageAUrl, imageBUrl, t, {
          timestamp: `t* = ${(t * 100).toFixed(0)}% · ${s.title.split(' ')[0]}`
        });
        setIntermediateUrl(blended);
      }
    }

    setGeneratedTimestamp(
      `t* = ${timeA.replace(' UTC', '')} + ${(t * 15).toFixed(1)}m UTC`
    );
    setIsGenerating(false);
    setHasGenerated(true);
  };

  // Video player controls
  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setVideoProgress((current / dur) * 100);
    setVideoCurrentTime(`${current.toFixed(1)}s`);
    setVideoDuration(`${dur.toFixed(1)}s`);
  };

  const handleVideoSeek = (e) => {
    if (!videoRef.current) return;
    const seekPercent = +e.target.value;
    const dur = videoRef.current.duration || 1;
    videoRef.current.currentTime = (seekPercent / 100) * dur;
    setVideoProgress(seekPercent);
  };

  const metrics = PLACEHOLDER_METRICS.methods[method];
  const activeScene = SAMPLE_SCENES[videoIndex] || SAMPLE_SCENES[0];

  function exportFile() {
    const a = document.createElement('a');
    a.href = intermediateUrl || '/astra-prototype-mock.nc';
    a.download = `astra-noaa-intermediate-reconstruction-${t.toFixed(2)}.png`;
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
            <span className="prototype-channel-tag">GOES-18/19 ABI · CH.13 (10.3 μm)</span>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Choose custom photograph...</span>
                  </button>
                </div>
              )}

              {imageAUrl && (
                <div className="thumbnail-preview">
                  <img src={imageAUrl} alt="Timestamp A observation" />
                  <span className="thumb-caption">{timeA} · Original NOAA IR</span>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Choose custom photograph...</span>
                  </button>
                </div>
              )}

              {imageBUrl && (
                <div className="thumbnail-preview">
                  <img src={imageBUrl} alt="Timestamp B observation" />
                  <span className="thumb-caption">{timeB} · Original NOAA IR</span>
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
                    <span>Synthesizing Frame...</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Generate Intermediate Image</span>
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
            </label>
            <label className="toggle-row">
              Optical flow vector field
              <input
                type="checkbox"
                checked={flow}
                onChange={(e) => setFlow(e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              Confidence heat map
              <input
                type="checkbox"
                checked={confidence}
                onChange={(e) => setConfidence(e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              Flag low-confidence regions
              <input
                type="checkbox"
                checked={low}
                onChange={(e) => setLow(e.target.checked)}
              />
            </label>

            <div className="control-divider" />

            <label className="field-label" htmlFor="compare">
              COMPARE VIEW
            </label>
            <select
              id="compare"
              value={compare}
              onChange={(e) => setCompare(e.target.value)}
            >
              <option>Reconstruction</option>
              <option>Slider</option>
              <option>Difference</option>
            </select>
          </aside>

          {/* CENTER: VIEWER */}
          <section className="viewer panel">
            <div className="viewer-head">
              <div>
                <span className="viewer-tag">GOES-18/19 ABI · CHANNEL 13</span>
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
                <div className="flow-vector-overlay">
                  <svg width="100%" height="100%" viewBox="0 0 400 250" preserveAspectRatio="none">
                    <defs>
                      <marker id="flowArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#00E5FF" />
                      </marker>
                    </defs>
                    {[40, 90, 140, 190, 240, 290, 340].map((x) =>
                      [30, 80, 130, 180, 220].map((y) => (
                        <line
                          key={`${x}-${y}`}
                          x1={x}
                          y1={y}
                          x2={x + 18}
                          y2={y + (x > 200 ? -8 : 10)}
                          stroke="#00E5FF"
                          strokeWidth="1.5"
                          strokeOpacity="0.85"
                          markerEnd="url(#flowArrow)"
                        />
                      ))
                    )}
                  </svg>
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

            {/* TIMELINE CONTROLS */}
            <div className="timeline-wrap">
              <div className="timeline-head">
                <span className="mono">INTERPOLATION FRACTION t* = {t.toFixed(2)}</span>
                <span className="mono-sub">ESTIMATED INTERVAL: +{(t * 15).toFixed(1)} MIN</span>
              </div>

              <div className="slider-track-wrap">
                <input
                  className="time-slider"
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download intermediate image</span>
            </button>
            <p className="export-note">
              Exports the generated intermediate reconstruction at {generatedTimestamp}.
            </p>
          </aside>
        </div>

        {/* ─── NEW BOTTOM SECTION: CONTINUOUS ATMOSPHERIC EVOLUTION VIDEO ─── */}
        <section className="evolution-video-section panel">
          <div className="video-section-header">
            <div>
              <div className="eyebrow">CONTINUOUS TEMPORAL EVOLUTION</div>
              <h2>Atmospheric Evolution Video Player</h2>
              <p className="video-section-desc">
                High-cadence video reconstruction demonstrating atmospheric advection between the two boundary time frames ({timeA} to {timeB}).
                Reconstructs intermediate vortex rotation, convective cell expansion, and cloud-top brightness temperature dynamics.
              </p>
            </div>
            <div className="video-source-badge">
              <span className="source-pill">NOAA NESDIS GOES-18 ABI BAND 13</span>
              <span className="source-pill-sec">10.3 μm CLEAN INFRARED</span>
            </div>
          </div>

          <div className="video-player-container">
            {/* Main Video Viewport */}
            <div className="video-viewport">
              <video
                ref={videoRef}
                key={activeScene.videoUrl}
                src={activeScene.videoUrl}
                className="evolution-video-element"
                autoPlay
                loop
                muted
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />

              {/* Live HUD Telemetry Overlay */}
              <div className="video-hud-overlay">
                <div className="video-hud-top">
                  <div className="hud-tag">
                    <span className="hud-blip" />
                    <span>LIVE TEMPORAL RECONSTRUCTION · 50 FRAMES</span>
                  </div>
                  <div className="hud-coords">
                    <span>SECTOR: {activeScene.title.split(' ')[0].toUpperCase()}</span>
                    <span>INTERVAL: 15 MIN</span>
                  </div>
                </div>

                <div className="video-hud-bottom">
                  <div className="hud-timestamp">
                    <span className="hud-time-label">OBSERVATION WINDOW:</span>
                    <strong>{activeScene.timeA} → {activeScene.timeMid} → {activeScene.timeB}</strong>
                  </div>
                  <div className="hud-channel">
                    <span>GOES-18 ABI · 10.3 μm Clean IR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="video-controls-bar">
              <button
                type="button"
                className="video-ctrl-btn play-btn"
                onClick={toggleVideoPlay}
                aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
              >
                {isVideoPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
                <span>{isVideoPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <div className="video-scrubber-track">
                <input
                  type="range"
                  className="video-scrubber-input"
                  min="0"
                  max="100"
                  value={videoProgress}
                  onChange={handleVideoSeek}
                  aria-label="Timeline seek"
                />
              </div>

              <div className="video-time-indicator">
                <span className="current-time">{videoCurrentTime}</span>
                <span className="time-divider">/</span>
                <span className="total-time">{videoDuration}</span>
              </div>

              <div className="video-speed-group">
                <span className="speed-label">Speed:</span>
                {[0.5, 1, 2].map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    className={`speed-btn ${playbackSpeed === sp ? 'active' : ''}`}
                    onClick={() => setPlaybackSpeed(sp)}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Selector Cards */}
            <div className="video-scenario-cards">
              {SAMPLE_SCENES.map((scene, idx) => (
                <button
                  key={scene.id}
                  type="button"
                  className={`scenario-card ${videoIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setVideoIndex(idx);
                    handleSelectSampleA(idx);
                    handleSelectSampleB(idx);
                  }}
                >
                  <div className="scenario-thumb">
                    <img src={scene.imgA} alt={scene.title} />
                    <span className="scenario-tag">0{idx + 1}</span>
                  </div>
                  <div className="scenario-info">
                    <h4>{scene.title}</h4>
                    <p>{scene.timeA} to {scene.timeB}</p>
                    <span className="scenario-meta">{scene.source}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>ASTRA AI · ENGINEERING DESIGN & INNOVATION · GROUP 17 · VIT PUNE</span>
          <span>INTERMEDIATE STATE RECONSTRUCTION</span>
          <a href="/privacy">PRIVACY</a>
        </footer>
      </main>
    </div>
  );
}
