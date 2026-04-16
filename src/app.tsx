import { signal, computed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { Button, ButtonStyles } from './ui/components/Button';
import { CardStyles } from './ui/components/Card';
import { SparkleStyles } from './ui/components/Sparkle';
import { LearnMode } from './stages/learn/index';
import './stages/learn/learn.css';

// ---- Inject component styles ----
// Components export CSS strings; inject them once at app level.
const styleSheet = [ButtonStyles, CardStyles, SparkleStyles].join('\n');
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = styleSheet;
  document.head.appendChild(style);
}

// ---- Simple hash-based router ----

const route = signal(window.location.hash || '#/');

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.value = window.location.hash || '#/';
  });
}

interface RouteMatch {
  page: 'home' | 'learn';
  zoneId?: string;
}

const currentRoute = computed((): RouteMatch => {
  const hash = route.value;

  // #/learn/2 or #/learn
  const learnMatch = hash.match(/^#\/learn(?:\/(\d+))?$/);
  if (learnMatch) {
    return { page: 'learn', zoneId: learnMatch[1] || '1' };
  }

  return { page: 'home' };
});

// ---- App ----

export function App() {
  const r = currentRoute.value;

  if (r.page === 'learn') {
    return (
      <LearnMode
        zoneId={r.zoneId}
        onBack={() => { window.location.hash = '#/'; }}
      />
    );
  }

  // Landing page
  return (
    <main class="learn-landing" role="main">
      <h1 class="learn-landing__title">Phonics Flash</h1>
      <p class="learn-landing__subtitle">
        Learn letter sounds with fun flash cards!
      </p>
      <Button
        variant="primary"
        onClick={() => { window.location.hash = '#/learn/1'; }}
      >
        Start Learning
      </Button>
    </main>
  );
}
