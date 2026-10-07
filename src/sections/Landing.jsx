import React, { useEffect, useState } from 'react';
import CloudCanvas from '../components/CloudCanvas.jsx';
import Reveal from '../components/Reveal.jsx';
import { Header, Footer, Eyebrow } from '../components/SiteChrome.jsx';
import PipelineStages from '../components/PipelineStages.jsx';
import {
  PLACEHOLDER_METRICS,
  BENCHMARK_COMPARISON,
  SCENARIO_BENCHMARKS,
  TEAM_MEMBERS
} from '../data/metrics.js';

const stack = [
  'Python',
  'PyTorch',
  'Torchvision',
  'NumPy',
  'OpenCV',
  'RAFT-Small',
  'Residual U-Net',
  'NetCDF4',
  'GOES-16 ABI · Ch.13'
];

function Landing() {
  const [progress, setProgress] = useState(0);
  const [activeScenario, setActiveScenario] = useState('overall');

  useEffect(() => {
    const fn = () => setProgress(Math.min(1, window.scrollY / (window.innerHeight * 2.5)));
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const currentScenario = SCENARIO_BENCHMARKS.find(s => s.id === activeScenario) || SCENARIO_BENCHMARKS[0];

  return (
    <>
      <div className="progress-track">
        <i style={{ transform: `scaleX(${Math.max(0.03, progress)})` }} />
      </div>

      <Header />

      <main>
        {/* HERO */}
        <section className="hero section-shell">
          <div className="hero-copy">
            <Eyebrow>GROUP 17 · ENGINEERING DESIGN & INNOVATION</Eyebrow>
            <h1>
              Reconstructing the<br />
              <span className="quiet-line">minutes between</span><br />
              satellite frames.
            </h1>
            <p className="hero-sub">
              ASTRA AI estimates the missing atmospheric state between consecutive GOES-16 infrared observations,
              then provides a scientific reliability index for downstream forecasting.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/demo">
                Launch prototype <span>↗</span>
              </a>
              <a className="button button-quiet" href="#how-it-works">
                How it works <span>↓</span>
              </a>
            </div>
            <div className="hero-note">
              <span className="status-pulse" /> PROTOTYPE · SYNTHETIC VISUALIZATION · MOCK DATA
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-head">
              <span>ABI / CHANNEL 13</span>
              <span>10.3 μm · SIMULATED</span>
            </div>
            <div className="cloud-wrap hero-cloud">
              <CloudCanvas progress={progress} seed={4} />
              <div className="frame-tag frame-a">FRAME A <span>t − Δt</span></div>
              <div className="frame-tag frame-b">FRAME B <span>t + Δt</span></div>
              <div className="crosshair crosshair-one" />
              <div className="crosshair crosshair-two" />
            </div>
            <div className="visual-foot">
              <span>BRIGHTNESS TEMPERATURE FIELD</span>
              <span>t = {progress.toFixed(2)}</span>
            </div>
            <div className="hero-scroll">
              SCROLL TO RECONSTRUCT <span />
            </div>
          </div>
        </section>

        {/* SECTION 01: HOW IT WORKS · 6-STAGE RECONSTRUCTION PIPELINE */}
        <section className="how-it-works-master-section section-shell" id="how-it-works">
          <Reveal>
            <div className="section-index">01 / HOW IT WORKS · 6-STAGE PIPELINE ARCHITECTURE</div>
            <div className="how-it-works-hero-head">
              <h2>
                Six pipeline stages.<br />
                <span>One continuous atmospheric reconstruction.</span>
              </h2>
              <p>
                Scroll through the cards below to reveal each stage of the solution pipeline. Every card details
                what you have to do in that step alongside the scientific solution picture produced by the system.
              </p>
            </div>
          </Reveal>

          {/* Quick Mathematical Formulation Context Bar */}
          <div className="gap-context-pill-banner">
            <div className="gap-mini-block">
              <span className="gap-mini-tag">INPUT OBSERVATION 01</span>
              <code>I₀ · Brightness Temp @ t₀</code>
            </div>
            <div className="gap-mini-connector">
              <span>+</span>
            </div>
            <div className="gap-mini-block">
              <span className="gap-mini-tag">INPUT OBSERVATION 02</span>
              <code>I₁ · Brightness Temp @ t₁</code>
            </div>
            <div className="gap-mini-connector">
              <span>+</span>
            </div>
            <div className="gap-mini-block">
              <span className="gap-mini-tag">QUERY TIMESTAMP</span>
              <code>t* · Requested Instant</code>
            </div>
            <div className="gap-mini-connector">
              <i>→</i>
            </div>
            <div className="gap-mini-block highlight-recon">
              <span className="gap-mini-tag">ESTIMATED PHYSICAL STATE</span>
              <code>Î(t*) + Spatial Confidence + SRI</code>
            </div>
          </div>

          {/* INTERACTIVE SCROLL-THROUGH PIPELINE STAGE CARDS */}
          <PipelineStages />
        </section>

        {/* SECTION 04: METHOD COMPARISON (WITH RESULTS) */}
        <section className="comparison-results-section section-shell" id="method-comparison">
          <Reveal>
            <div className="section-index">04 / METHOD COMPARISON (WITH RESULTS)</div>
            <div className="comparison-results-head">
              <h2>
                Evaluation against baselines.<br />
                <span>Simulated experimental results.</span>
              </h2>
              <div className="comparison-badge-wrap">
                <span className="benchmark-chip">FAKE / MOCK EXPERIMENTAL DATA</span>
                <span className="sample-size-tag">TEST SPLIT N = 1,420 PATCHES</span>
              </div>
            </div>
            <p className="comparison-sub">
              Comparative benchmark evaluating classical pixel blending, dense polynomial advection, and recurrent deep optical flow against ASTRA AI's hybrid residual framework. All values are simulated prototype benchmarks.
            </p>
          </Reveal>

          {/* Metric Wins Highlight Grid */}
          <Reveal delay={0.05}>
            <div className="metric-wins-grid">
              <div className="win-card">
                <span className="win-badge">+4.27 dB PSNR</span>
                <strong>36.45 dB</strong>
                <small>Peak Signal-to-Noise Ratio</small>
                <p>Significant gain over pure deep RAFT flow (32.18 dB) through learned convective residual compensation.</p>
              </div>
              <div className="win-card">
                <span className="win-badge">+14.5% SSIM</span>
                <strong>0.957</strong>
                <small>Structural Similarity Index</small>
                <p>Retains sharp anvil cloud boundaries, vortex curls, and fine-scale thermal gradients.</p>
              </div>
              <div className="win-card">
                <span className="win-badge">74.3% ERROR DROP</span>
                <strong>0.0084</strong>
                <small>Mean Squared Error (Normalized)</small>
                <p>Reduces artifacting and severe boundary ghosting characteristic of linear cross-fading.</p>
              </div>
              <div className="win-card">
                <span className="win-badge">OPERATIONAL GATE</span>
                <strong>92.6%</strong>
                <small>SRI Quality Gate Pass Rate</small>
                <p>Passes scientific reliability threshold of ≥65% across 1,315 of 1,420 test split scenes.</p>
              </div>
            </div>
          </Reveal>

          {/* Benchmark Results Table */}
          <Reveal delay={0.1}>
            <div className="benchmark-table-container">
              <div className="table-header-meta">
                <div>
                  <h3>Quantitative Benchmark Matrix</h3>
                  <span>GOES-16 ABI Channel 13 (10.3 μm Clean IR) · 256×256 Patches · Δt = 10 min</span>
                </div>
                <span className="table-badge">SYNTHETIC BENCHMARK</span>
              </div>

              <div className="table-scroll-wrap">
                <table className="benchmark-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Paradigm</th>
                      <th>PSNR (dB) ↑</th>
                      <th>SSIM ↑</th>
                      <th>MSE (×10⁻²) ↓</th>
                      <th>SRI Score ↑</th>
                      <th>Latency</th>
                      <th>Reliability Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BENCHMARK_COMPARISON.map(row => (
                      <tr key={row.name} className={row.isOurs ? 'highlight-row' : ''}>
                        <td>
                          <div className="method-name-cell">
                            <strong>{row.name}</strong>
                            {row.isOurs && <span className="our-badge">PROPOSED</span>}
                          </div>
                        </td>
                        <td><span className="paradigm-tag">{row.methodology}</span></td>
                        <td><b className={row.isOurs ? 'accent-stat' : ''}>{row.psnr}</b></td>
                        <td><b className={row.isOurs ? 'accent-stat' : ''}>{row.ssim}</b></td>
                        <td><b>{row.mse}</b></td>
                        <td><span className={`sri-cell ${row.isOurs ? 'sri-high' : ''}`}>{row.sri}</span></td>
                        <td><code>{row.latency}</code></td>
                        <td><span className="assessment-note">{row.reliability}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>

          {/* Scenario Benchmark Deep Dive */}
          <Reveal delay={0.15}>
            <div className="scenario-section">
              <div className="scenario-head">
                <h3>Atmospheric Scenario Breakdown</h3>
                <p>Performance variations under distinct meteorological dynamics and cloud regimes.</p>
              </div>

              <div className="scenario-tabs">
                {SCENARIO_BENCHMARKS.map(s => (
                  <button
                    key={s.id}
                    className={`scenario-tab-button ${activeScenario === s.id ? 'active' : ''}`}
                    onClick={() => setActiveScenario(s.id)}
                  >
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>

              <div className="scenario-detail-card">
                <div className="scenario-info">
                  <h4>{currentScenario.title}</h4>
                  <p>{currentScenario.description}</p>
                  <div className="scenario-stat-pill">
                    <span>SRI Gate Pass Rate: <strong>{currentScenario.sriPassRate}</strong></span>
                    <span>Target SSIM: <strong>{currentScenario.astraSsim}</strong></span>
                  </div>
                </div>

                <div className="scenario-bars">
                  <div className="scenario-bar-item">
                    <div className="bar-label"><span>Linear Blending</span><b>{currentScenario.linearPsnr}</b></div>
                    <div className="bar-track"><i style={{ width: `${(parseFloat(currentScenario.linearPsnr) / 42) * 100}%` }} /></div>
                  </div>
                  <div className="scenario-bar-item">
                    <div className="bar-label"><span>Farneback Optical Flow</span><b>{currentScenario.farnebackPsnr}</b></div>
                    <div className="bar-track"><i style={{ width: `${(parseFloat(currentScenario.farnebackPsnr) / 42) * 100}%` }} /></div>
                  </div>
                  <div className="scenario-bar-item">
                    <div className="bar-label"><span>RAFT-Small (Flow-only)</span><b>{currentScenario.raftPsnr}</b></div>
                    <div className="bar-track"><i style={{ width: `${(parseFloat(currentScenario.raftPsnr) / 42) * 100}%` }} /></div>
                  </div>
                  <div className="scenario-bar-item astra-bar">
                    <div className="bar-label"><span>ASTRA AI (Ours · Refined)</span><b>{currentScenario.astraPsnr}</b></div>
                    <div className="bar-track astra-track"><i style={{ width: `${(parseFloat(currentScenario.astraPsnr) / 42) * 100}%` }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Interactive Visual Comparison Slider */}
          <Reveal delay={0.2}>
            <div className="visual-compare-wrapper">
              <div className="compare-heading">
                <h2>
                  Interpolation smooths.<br />
                  <span>Reconstruction reasons about motion.</span>
                </h2>
                <p>
                  Move the interactive divider to compare illustrative methods. Fields are procedurally generated in WebGL; this demonstrates the qualitative difference between linear ghosting and flow-aligned refinement.
                </p>
              </div>

              <Compare />

              <div className="compare-legend">
                <span><i /> LINEAR BLEND (GHOSTING)</span>
                <span><i /> ASTRA REFINED (WARP + RESIDUAL)</span>
                <span>SIMULATED CLOUD FIELD</span>
              </div>
            </div>
          </Reveal>

          {/* Scientific Reliability Index Explanation */}
          <Reveal delay={0.25}>
            <div className="reliability-layout">
              <div>
                <h2>
                  An estimate should<br />
                  show its uncertainty.
                </h2>
                <p>
                  Confidence is not a guarantee. The proposed Scientific Reliability Index (SRI) summarizes bidirectional flow consistency, residual energy, and brightness-temperature bounds to provide an automated quality gate for downstream numerical weather models.
                </p>
                <a className="text-link" href="/demo">
                  Inspect diagnostics in workspace <span>↗</span>
                </a>
              </div>
              <div className="reliability-visual">
                <div className="sri-ring">
                  <div>
                    <strong>92.6%</strong>
                    <span>AVG SRI · BENCHMARK</span>
                  </div>
                </div>
                <div className="sri-scale">
                  <span>0</span><i /><span>65% GATE</span><i /><span>100</span>
                </div>
                <p>
                  Amber marks lower-confidence regions.<br />
                  Estimates scoring below 65% trigger automated fallback.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* SECTION 05: TOOLING & REPRODUCIBILITY */}
        <section className="stack-section section-shell">
          <Reveal>
            <div className="section-index">05 / SCIENTIFIC TOOLING & PIPELINE</div>
            <div className="stack-head">
              <h2>
                Built for scientific<br />
                image reconstruction.
              </h2>
              <p>Proposed engineering stack and target satellite data source.</p>
            </div>
            <div className="stack-list">
              {stack.map((s, i) => (
                <span key={s}>
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  {s}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* SECTION 06: APPLICATIONS */}
        <section className="impact-section section-shell">
          <Reveal>
            <div className="section-index">06 / OPERATIONAL APPLICATIONS</div>
            <div className="impact-layout">
              <h2>
                More temporal detail.<br />
                Same satellite inputs.
              </h2>
              <div>
                <p>
                  Potential application domains include high-frequency convective nowcasting, hurricane rapid intensification tracking, and wildfire smoke plume dispersion monitoring.
                </p>
                <div className="impact-tags">
                  <span>WEATHER NOWCASTING</span>
                  <span>TROPICAL CYCLONE TRACKING</span>
                  <span>SEVERE CONVECTIVE WARNING</span>
                  <span>SOLAR IRRADIANCE FORECASTING</span>
                  <span>HIGH-RES SCIENTIFIC EXPORT</span>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* SECTION 07: TEAM */}
        <section className="team-section section-shell" id="team">
          <Reveal>
            <div className="section-index">07 / PROJECT TEAM</div>
            <div className="team-head">
              <div>
                <h2>
                  The Minds Behind ASTRA.<br />
                  <span>Engineering Design & Innovation · Group 17.</span>
                </h2>
                <p className="team-sub">
                  Department of Computer Engineering, Vishwakarma Institute of Technology, Pune-37
                </p>
              </div>
              <a className="button button-primary" href="/demo">
                Launch prototype <span>↗</span>
              </a>
            </div>

            <div className="team-cards-grid">
              {TEAM_MEMBERS.map(member => (
                <article key={member.name} className="team-card simple-team-card">
                  <div className="team-card-top">
                    <div className="member-avatar">
                      <span>{member.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <span className="member-team-tag">Group 17</span>
                  </div>
                  <h3>{member.name}</h3>
                  <div className="team-contact-details">
                    <div className="team-contact-row">
                      <span className="contact-icon" aria-hidden="true">📞</span>
                      <span className="contact-label-text">Phone:</span>
                      <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="team-phone-link">
                        {member.phone}
                      </a>
                    </div>
                    <div className="team-contact-row">
                      <span className="contact-icon" aria-hidden="true">✉</span>
                      <span className="contact-label-text">College Email:</span>
                      <a href={`mailto:${member.email}`} className="team-email-link">
                        {member.email}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="team-institution-footer">
              <div className="inst-block">
                <span>INSTITUTION</span>
                <strong>Vishwakarma Institute of Technology, Pune</strong>
                <small>Department of Computer Engineering · Academic Year 2025–2026</small>
              </div>
              <div className="inst-block">
                <span>PROJECT DOMAIN</span>
                <strong>Satellite Image Super-Resolution & Atmospheric Physics</strong>
                <small>Course: Engineering Design & Innovation (EDI)</small>
              </div>
            </div>
          </Reveal>
        </section>

        {/* SECTION 08: CONTACT US */}
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}

function ContactSection() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    organization: '',
    topic: 'Academic Collaboration',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickTopics = [
    'Request NetCDF Sample',
    'Research Collaboration',
    'Model Weights & Code',
    'Conference Pre-print',
    'General Inquiry'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleQuickTopic = (topic) => {
    setFormState(prev => ({
      ...prev,
      topic,
      message: prev.message ? prev.message : `Hi Group 17, I am interested in: ${topic}. Please share relevant details.`
    }));
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormState({
      name: '',
      email: '',
      organization: '',
      topic: 'Academic Collaboration',
      message: ''
    });
  };

  return (
    <section className="contact-section section-shell" id="contact">
      <Reveal>
        <div className="section-index">08 / CONTACT US</div>
        <div className="contact-head">
          <h2>
            Get in touch.<br />
            <span>Research inquiry & academic collaboration.</span>
          </h2>
          <p>
            Have questions regarding the neural reconstruction pipeline, dataset calibration, or methodology? Reach out to Group 17.
          </p>
        </div>

        <div className="contact-grid">
          {/* Left Info Panel */}
          <div className="contact-info-panel">
            <div className="contact-info-card">
              <span className="contact-label">RESEARCH INQUIRIES</span>
              <strong>group17.astra@vit.edu</strong>
              <p>Primary correspondence for academic peer review and research inquiries.</p>
            </div>

            <div className="contact-info-card">
              <span className="contact-label">INSTITUTIONAL ADDRESS</span>
              <strong>Department of Computer Engineering</strong>
              <p>
                Vishwakarma Institute of Technology<br />
                666, Upper Indiranagar, Bibwewadi<br />
                Pune, Maharashtra 411037, India
              </p>
            </div>

            <div className="contact-info-card">
              <span className="contact-label">INQUIRY TOPICS</span>
              <p className="quick-topics-hint">Click a topic to auto-fill your message:</p>
              <div className="quick-topics-wrap">
                {quickTopics.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`topic-pill ${formState.topic === t ? 'active' : ''}`}
                    onClick={() => handleQuickTopic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="contact-response-badge">
              <span className="status-dot" />
              <span>TYPICAL RESPONSE TIME: WITHIN 24–48 BUSINESS HOURS</span>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="contact-form-panel">
            {submitted ? (
              <div className="form-success-card">
                <div className="success-icon">✓</div>
                <h3>Inquiry Dispatched</h3>
                <p>
                  Thank you, <strong>{formState.name}</strong>. Your message regarding <em>"{formState.topic}"</em> has been recorded in the prototype inbox.
                </p>
                <div className="success-meta">
                  <span>CONFIRMATION ID: <code>ASTRA-EDI-2026-X7</code></span>
                  <span>RECIPIENT: <code>group17.astra@vit.edu</code></span>
                </div>
                <button className="button button-quiet" onClick={handleReset}>
                  Send another inquiry <span>↺</span>
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="e.g. Dr. Alex Mercer"
                      value={formState.name}
                      onChange={e => setFormState({ ...formState, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="e.g. alex.mercer@university.edu"
                      value={formState.email}
                      onChange={e => setFormState({ ...formState, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="org">Organization / Institution</label>
                    <input
                      id="org"
                      type="text"
                      placeholder="e.g. National Weather Center / University"
                      value={formState.organization}
                      onChange={e => setFormState({ ...formState, organization: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="topic">Topic of Inquiry</label>
                    <select
                      id="topic"
                      value={formState.topic}
                      onChange={e => setFormState({ ...formState, topic: e.target.value })}
                    >
                      <option>Academic Collaboration</option>
                      <option>Request NetCDF Sample</option>
                      <option>Model Weights & Code</option>
                      <option>Conference Pre-print</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    rows="4"
                    required
                    placeholder="Describe your research inquiry, proposed collaboration, or question..."
                    value={formState.message}
                    onChange={e => setFormState({ ...formState, message: e.target.value })}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Dispatching...' : 'Send inquiry'} <span>↗</span>
                  </button>
                  <span className="form-notice">
                    Mock submission · Data handled locally in browser
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Compare() {
  const [split, setSplit] = useState(52);
  return (
    <div className="compare-frame">
      <div className="compare-layer compare-base">
        <CloudCanvas progress={0.5} seed={3} />
        <span className="compare-label">ASTRA · REFINED (ILLUSTRATIVE)</span>
      </div>
      <div
        className="compare-layer compare-top"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      >
        <CloudCanvas progress={0.5} seed={3} />
        <span className="compare-label">LINEAR INTERPOLATION</span>
      </div>
      <div className="compare-divider" style={{ left: `${split}%` }} />
      <input
        aria-label="Compare linear interpolation and refined reconstruction"
        type="range"
        min="8"
        max="92"
        value={split}
        onChange={e => setSplit(+e.target.value)}
      />
    </div>
  );
}

export default Landing;
