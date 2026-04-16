import { signal } from '@preact/signals';

const appReady = signal(true);

export function App() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-5)' }}>
        Phonics Flash
      </h1>
      {appReady.value && (
        <p style={{ fontSize: 'var(--text-lg)' }}>Ready to learn!</p>
      )}
    </main>
  );
}
