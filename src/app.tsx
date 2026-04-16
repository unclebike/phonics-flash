import { signal } from '@preact/signals';

const appReady = signal(true);

export function App() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#1a1a2e',
        color: '#eee',
      }}
    >
      <h1>Phonics Flash</h1>
      {appReady.value && <p>Ready to learn!</p>}
    </main>
  );
}
