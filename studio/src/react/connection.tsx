import { useEffect, useRef, useState } from 'react';
import { OSH } from '../../../shared/runtime/client';
export function ConnectionNotice() {
  const [view, setView] = useState({ visible: false, recovered: false, title: '', message: '' }),
    [checking, setChecking] = useState(false);
  const state = useRef({ checking: false, disconnected: false, dismissed: false, alive: true }),
    checkRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    const session = state.current;
    session.alive = true;
    let recovery: ReturnType<typeof setTimeout> | undefined;
    const lost = (reason: string) => {
      if (recovery) clearTimeout(recovery);
      session.disconnected = true;
      if (session.alive)
        setView({
          visible: !session.dismissed,
          recovered: false,
          title: 'Connection interrupted',
          message: reason + ' Your project stays here. You can keep editing while we reconnect.',
        });
      const badge = document.getElementById('rt');
      if (badge) {
        badge.textContent = '○ disconnected';
        badge.classList.remove('on');
      }
    };
    const check = async () => {
      if (session.checking) return;
      session.checking = true;
      if (session.alive) setChecking(true);
      try {
        const result = await OSH.health();
        if (!session.alive) return;
        if (!result.online) {
          lost(
            !result.info
              ? 'Can’t reach the local server.'
              : !result.info.comfyui
                ? 'ComfyUI is unavailable.'
                : 'The generation connection is unavailable.',
          );
          return;
        }
        const badge = document.getElementById('rt');
        if (badge) {
          badge.textContent = '● local ComfyUI';
          badge.classList.add('on');
        }
        if (session.disconnected) {
          session.disconnected = false;
          session.dismissed = false;
          setView({
            visible: true,
            recovered: true,
            title: 'Connection restored',
            message:
              'You’re ready to generate again. Any interrupted render needs checking before you try again.',
          });
          recovery = setTimeout(() => setView((v) => ({ ...v, visible: false })), 5000);
          dispatchEvent(new Event('osh-reconnected'));
        }
      } finally {
        session.checking = false;
        if (session.alive) setChecking(false);
      }
    };
    checkRef.current = check;
    const offline = () => lost('The browser lost its connection.'),
      online = () => {
        void check();
      };
    addEventListener('offline', offline);
    addEventListener('online', online);
    addEventListener('focus', online);
    const interval = setInterval(() => {
      if (!document.hidden) void check();
    }, 8000);
    void check();
    return () => {
      session.alive = false;
      clearInterval(interval);
      clearTimeout(recovery);
      removeEventListener('offline', offline);
      removeEventListener('online', online);
      removeEventListener('focus', online);
    };
  }, []);
  return (
    <section
      className={'connection-notice' + (view.recovered ? ' recovered' : '')}
      hidden={!view.visible}
      role="alert"
    >
      <strong>{view.title}</strong>
      <p>{view.message}</p>
      <div hidden={view.recovered}>
        <button
          disabled={checking}
          onClick={() => {
            state.current.dismissed = false;
            void checkRef.current();
          }}
        >
          {checking ? 'Reconnecting…' : 'Retry connection'}
        </button>
        <button onClick={()=>{location.href='/studio/admin'}}>
          Reconnect in Admin
        </button>
        <button
          onClick={() => {
            state.current.dismissed = true;
            setView((v) => ({ ...v, visible: false }));
          }}
        >
          Keep editing
        </button>
      </div>
    </section>
  );
}
