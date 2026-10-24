import { ProjectPicker, tryOnboarding } from './projects';
export function EditSurface() {
  return (
    <>
      <header className="studio-header">
        <a href="../index.html" id="backLink">
          {'←'}
        </a>
        <h1>{'Edit Anything'}</h1>
        <span className="src" id="src"></span>
        <span className="from hidden" id="from" style={{ display: 'none' }}>
          {'from Director'}
        </span>
        <span className="sp"></span>
        <span id="acts"></span>
      </header>
      <div className="app">
        <aside className="l" id="shared"></aside>
        <main>
          <div className="bar">
            <div className="seg" id="tool">
              <button data-t="click" className="on">
                {'Click to select'}
              </button>
              <button data-t="place">{'Whole place'}</button>
            </div>
            <span className="sp"></span>
            <div className="seg" id="cmp">
              <button data-c="after" className="on">
                {'Edited'}
              </button>
              <button data-c="wipe">{'Compare'}</button>
              <button data-c="before">{'Original'}</button>
            </div>
          </div>
          <div className="view" id="view">
            <canvas id="orig"></canvas>
            <canvas id="cv"></canvas>
            <div className="wipe" id="wipe" style={{ display: 'none' }}></div>
            <span className="lab" id="lA" style={{ left: '10px', display: 'none' }}>
              {'Original'}
            </span>
            <span className="lab" id="lB" style={{ right: '10px', display: 'none' }}>
              {'Edited'}
            </span>
          </div>
          <div className="bar">
            <span className="hint" id="hint">
              {'Click Mia, Bolt, the sky or the ground. Esc cancels.'}
            </span>
          </div>
        </main>
        <aside className="r">
          <div className="sec">
            {'Edits '}
            <span id="ecount"></span>
          </div>
          <div className="layers" id="layers"></div>
          <div className="sec">{'Selected'}</div>
          <div id="selp">
            <div className="empty">{'Nothing selected yet.'}</div>
          </div>
          <div className="sec">
            {'Reference '}
            <span>{'optional'}</span>
          </div>
          <div className="drop" data-toast="Drop an image to guide the edit">
            {'Drop a reference image'}
          </div>
          <div className="sec">{'Keep'}</div>
          <div className="chips" id="keep">
            <button className="chip on">{'Lighting'}</button>
            <button className="chip on">{'Perspective'}</button>
            <button className="chip on">{'Pose'}</button>
          </div>
          <div className="note">
            {'Own footage only. Costumes, props and places — no real-person face swaps.'}
          </div>
        </aside>
      </div>
    </>
  );
}
