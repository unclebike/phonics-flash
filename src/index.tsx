import { render } from 'preact';
import './ui/tokens.css';
import './ui/global.css';
import { App } from './app';

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app still works without it
    });
  });
}
