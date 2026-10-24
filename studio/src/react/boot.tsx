import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { ReactNode } from 'react';
import './app.css';
export async function bootStudio(surface: ReactNode, start: () => Promise<unknown>) {
  const root = createRoot(document.getElementById('studio-root')!);
  flushSync(() => root.render(surface));
  try {
    await start();
  } catch (error) {
    console.error('Studio startup failed', error);
    root.render(
      <main className="studio-startup-error" role="alert">
        <h1>Studio couldn’t open</h1>
        <p>Your saved projects are still in this browser.</p>
        <p>{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
        <button onClick={() => location.reload()}>Reload Studio</button>
      </main>,
    );
  }
}
