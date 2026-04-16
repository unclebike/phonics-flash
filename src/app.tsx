import { signal, computed } from '@preact/signals';
import { Button, ButtonStyles } from './ui/components/Button';
import { CardStyles } from './ui/components/Card';
import { SparkleStyles } from './ui/components/Sparkle';
import { LearnMode } from './stages/learn/index';
import { DrillSession } from './stages/learn/DrillSession';
import { BossLevel } from './stages/beat/index';
import { WorldRoute } from './world/index';
import { TeacherPanel } from './stages/teacher/TeacherPanel';
import './stages/learn/learn.css';
import './stages/learn/drill.css';
import './stages/beat/beat.css';
import './stages/teacher/teacher.css';

// ---- Inject component styles ----
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

type Page = 'home' | 'learn' | 'world' | 'beat' | 'teacher' | 'drill';

interface RouteMatch {
  page: Page;
  zoneId?: string;
}

const currentRoute = computed((): RouteMatch => {
  const hash = route.value;

  if (hash === '#/teacher' || hash.startsWith('#/teacher/')) {
    return { page: 'teacher' };
  }

  if (hash === '#/drill' || hash.startsWith('#/drill/')) {
    return { page: 'drill' };
  }

  if (hash === '#/world' || hash.startsWith('#/world/')) {
    return { page: 'world' };
  }

  const beatMatch = hash.match(/^#\/beat\/([\w-]+)$/);
  if (beatMatch) {
    return { page: 'beat', zoneId: beatMatch[1] };
  }

  // #/learn/<zoneId> or #/learn — legacy presentation-and-reveal session,
  // retained for the zone-entry flow. Daily drill lives at #/drill.
  const learnMatch = hash.match(/^#\/learn(?:\/([\w-]+))?$/);
  if (learnMatch) {
    return { page: 'learn', zoneId: learnMatch[1] || 'whispering-meadows' };
  }

  return { page: 'home' };
});

// ---- App ----

export function App() {
  const r = currentRoute.value;

  if (r.page === 'teacher') {
    return (
      <TeacherPanel
        onBack={() => { window.location.hash = '#/'; }}
      />
    );
  }

  if (r.page === 'drill') {
    return (
      <DrillSession
        onExit={() => { window.location.hash = '#/teacher'; }}
      />
    );
  }

  if (r.page === 'world') {
    return <WorldRoute />;
  }

  if (r.page === 'learn') {
    return (
      <LearnMode
        zoneId={r.zoneId}
        onBack={() => { window.location.hash = '#/world'; }}
      />
    );
  }

  if (r.page === 'beat' && r.zoneId) {
    return (
      <BossLevel
        zoneId={r.zoneId}
        onBack={() => { window.location.hash = '#/world'; }}
      />
    );
  }

  // Landing page
  return (
    <main class="learn-landing" role="main">
      <h1 class="learn-landing__title">Phonics Flash</h1>
      <p class="learn-landing__subtitle">
        Flash-and-mask phonics drill with a teacher in the driver's seat.
      </p>
      <div class="learn-landing__actions" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="primary"
          onClick={() => { window.location.hash = '#/teacher'; }}
        >
          Teacher Panel
        </Button>
        <Button
          variant="secondary"
          onClick={() => { window.location.hash = '#/drill'; }}
        >
          Quick Drill
        </Button>
        <Button
          variant="ghost"
          onClick={() => { window.location.hash = '#/world'; }}
        >
          World Map
        </Button>
      </div>
    </main>
  );
}
