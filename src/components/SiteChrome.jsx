import React, { useEffect, useState } from 'react';

export function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i/><i/><i/><i/>
    </span>
  );
}

export function Header({ demo = false }) {
  const [activeSection, setActiveSection] = useState('');
  const isRoot = typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '');

  useEffect(() => {
    if (!isRoot) return;
    const sectionIds = ['how-it-works', 'method-comparison', 'team', 'contact'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const id of [...sectionIds].reverse()) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(id);
          return;
        }
      }
      if (window.scrollY < 200) setActiveSection('');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isRoot]);

  return (
    <header className="site-header">
      <div className="header-left">
        <a className="wordmark" href="/" aria-label="ASTRA AI home">
          <Mark />
          <span>ASTRA<span className="wordmark-light"> / 17</span></span>
        </a>
      </div>

      <nav className="site-nav-center" aria-label="Top center navigation">
        <a
          href={isRoot ? '#how-it-works' : '/#how-it-works'}
          className={activeSection === 'how-it-works' ? 'active' : ''}
        >
          How it works
        </a>
        <a
          href={isRoot ? '#method-comparison' : '/#method-comparison'}
          className={activeSection === 'method-comparison' ? 'active' : ''}
        >
          Method Comparison
        </a>
        <a
          href={isRoot ? '#team' : '/#team'}
          className={activeSection === 'team' ? 'active' : ''}
        >
          Team
        </a>
        <a
          href={isRoot ? '#contact' : '/#contact'}
          className={activeSection === 'contact' ? 'active' : ''}
        >
          Contact us
        </a>
      </nav>

      <div className="header-actions">
        <a className="nav-cta" href={demo ? '/' : '/demo'}>
          {demo ? 'Overview' : 'Open prototype'}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  );
}

export function Eyebrow({ children }) {
  return (
    <p className="eyebrow">
      <span className="eyebrow-dot" />
      {children}
    </p>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <a className="wordmark" href="/">
          <Mark />
          <span>ASTRA<span className="wordmark-light"> / 17</span></span>
        </a>
        <p>
          Engineering Design & Innovation · Group 17<br />
          Department of Computer Engineering, Vishwakarma Institute of Technology, Pune
        </p>
      </div>

      <div className="footer-nav">
        <div className="footer-col">
          <strong>Navigation</strong>
          <a href="/#how-it-works">How it works</a>
          <a href="/#method-comparison">Method Comparison</a>
          <a href="/#team">Team</a>
          <a href="/#contact">Contact us</a>
        </div>
        <div className="footer-col">
          <strong>Resources</strong>
          <a href="/demo">Interactive prototype</a>
          <a href="/privacy">Privacy policy</a>
          <a href="/terms">Terms & conditions</a>
        </div>
      </div>

      <div className="footer-meta">
        <span className="footer-status">PROTOTYPE INTERFACE · MOCK DATA</span>
        <span>© 2026 Group 17 · All rights reserved</span>
      </div>
    </footer>
  );
}
