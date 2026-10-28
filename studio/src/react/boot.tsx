import {installErrorLogs,logBrowserError} from '../error-log';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { ReactNode } from 'react';
import './app.css';
export async function bootStudio(surface: ReactNode, start: () => Promise<unknown>) {
  installErrorLogs();
  // Controllers need mounted, measurable surfaces, but their undocked scaffold must never paint.
  document.body.dataset.studioBoot = 'loading';
  const loadingHost = document.createElement('div');
  loadingHost.className = 'studio-boot-overlay';
  document.body.append(loadingHost);
  const loadingRoot = createRoot(loadingHost);
  const root = createRoot(document.getElementById('studio-root')!);
  try {
    flushSync(() => {
      loadingRoot.render(<div className="studio-boot-status" role="status">Opening Studio…</div>);
      root.render(surface);
    });
    await start();
    // Let the controller's initial layout callbacks run before revealing the finished workspace.
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    document.body.dataset.studioBoot = 'ready';
  } catch (error) {
    logBrowserError(error,'Studio startup');
    console.error('Studio startup failed', error);
    flushSync(() => root.render(
      <div className="studio-startup-error" role="alert"><div className="studio-startup-error-content">
        <h1>Studio couldn’t open</h1>
        <p>Your saved projects are still in this browser.</p>
        <p>{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
        <button onClick={() => location.reload()}>Reload Studio</button>
      </div></div>,
    ));
    document.body.dataset.studioBoot = 'error';
  } finally {
    loadingRoot.unmount();
    loadingHost.remove();
  }
}
