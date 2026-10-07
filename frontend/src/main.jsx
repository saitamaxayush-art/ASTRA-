import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Landing from './sections/Landing.jsx';
import Demo from './sections/Demo.jsx';
import LegalPage from './sections/LegalPage.jsx';
import { MotionProvider } from './components/MotionProvider.jsx';

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return <MotionProvider>{path === '/demo' ? <Demo /> : path === '/privacy' ? <LegalPage kind="privacy" /> : path === '/terms' ? <LegalPage kind="terms" /> : <Landing />}</MotionProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
